// "use strict";

window.onload = function () {

    /** Add event listeners for actionable buttons */
    document.getElementById("upload_student").onchange = handleStudentFile;
    document.getElementById("upload_section").onchange = handleSectionFile;
    document.getElementById("run").onclick = runProgram;
    document.getElementById("save_as").onclick = saveResults;

    /** Track the number of students, number of males, number of females, top section choices, etc */
    let studentStats = {};
    function resetStudentStatistics() {
        return {
            stats: {
                numStudents: 0,
                numPreAssigned: 0,
                numMales: 0,
                numFemales: 0,
                numSexErrors: 0,
                numAthletes: 0,
                numPreferenceErrors: 0,
                preassignedIDs: new Set(),
                errorIDs: new Set(),
                IDs: new Set(),
                duplicateIDs: new Set(),
            },
            students: {},     // key: student ID, value: student
            preassigned: {},  // key: student ID, value: student
            unassigned: {},   // key: student ID, value: student
            assignments: {},  // key: student ID, value: section
        };
    }
    // function createNewStudent(student) {
    //     let illegalSections = getIllegalSections(student);
    //     student["Illegal Sections"] = illegalSections;  // now a new Set()
    //     return student;
    // }

    /** Track the number of sections, total number of seats, number of distinct professors, etc */
    let sectionStats = {};
    function resetSectionStatistics() {
        return {
            numSections: 0,
            numSeats: 0,
            professors: new Set(),
            IDs: new Set(),
            duplicateIDs: new Set(),
            sections: {},  // key: 'Core Section #': value: {stats: {}, students: set()}
        };
    }
    function createNewSection(section) {
        return {
            "Core Section #": section["Core Section #"],
            "Professor": section["Professor"],
            "Student Cap": section["Student Cap"],
            stats: {
                numStudents: 0,
                numMales: 0,
                numFemales: 0,
                numAthletes: 0,
                popularity: 0,
            },
            students: new Set(),
        };
    }

    /** Boolean values to track handling of students and sections. */
    let studentsHandled = false;
    let sectionsHandled = false;

    /** Define parameters for the cost matrix. */
    let costBase = 3.5;
    let defaultCost = Math.pow(costBase, 7);
    let illegalCost = Math.pow(costBase, 9);


    /** Handles the student csv file uploading. */
    function handleStudentFile() {
        studentStats = resetStudentStatistics();
        studentsHandled = false;
        handleRunButton();
        let file = document.getElementById("upload_student").files[0];
        Papa.parse(file, {
            header: true,
            skipEmptyLines: 'greedy',
            step: function (results) {
                if (results.errors.length > 0) {
                    console.log("ERRORS:", results.errors);
                    alert("An error occurred while handling the student csv file: " + results.errors);
                    return;
                }
                let student = results.data[0];
                processStudent(student);
            },
            complete: function (results, file) {
                studentStats.stats.numStudents = studentStats.stats.IDs.size;
                studentStats.stats.numPreAssigned = studentStats.stats.preassignedIDs.size;
                studentStats.stats.numPreferenceErrors = studentStats.stats.errorIDs.size;
                // Add stats to page
                addStatsToElement(document.getElementById("students_container"), getInitialStudentStatsString());  // Text-stats
                addPopularityChart(document.getElementById("students_container"))
                studentsHandled = true;
                handleRunButton();  // checks to see if sections are handled too
            }
        });
    }

    function type(value) {
        var regex = /^[object (S+?)]$/;
        var matches = Object.prototype.toString.call(value).match(regex) || [];
        
        return (matches[1] || 'undefined').toLowerCase();
      }
    
    /** Updates the student stats object */
    function processStudent(student) {
        let id = student["ID"];
        // Business
        if (studentStats.stats.IDs.has(id)) {
            studentStats.stats.duplicateIDs.add(id);
            return;
        }
        studentStats.stats.IDs.add(id);
        student["Illegal Sections"] = getIllegalSections(student);
        if (adjustStudentPrefErrors(student)) {  // modifies student's preferences if needed
            studentStats.stats.errorIDs.add(id);
        }
        if (student["Placement"] != "") {
            let sectionNum = student["Placement"];
            studentStats.stats.preassignedIDs.add(id);
            studentStats.preassigned[id] = sectionNum;
            addStudentToSection(student, sectionStats.sections[sectionNum]);
        }
        else {
            studentStats.unassigned[id] = student;
        }
        studentStats.students[id] = student;
        // Stats
        studentStats.stats.numMales += (student["Sex"] == "M") ? 1 : 0;
        studentStats.stats.numFemales += (student["Sex"] == "F") ? 1 : 0;
        studentStats.stats.numAthletes += (student["Athlete"] == "Y") ? 1 : 0;
        getPreferenceIDs(student).forEach(sectionID => {  // popularity score
            let prefNum = getPreferenceNumber(student, sectionID);
            if (sectionStats.IDs.has(sectionID) && sectionID !== "any") {
                sectionStats.sections[sectionID].stats.popularity += 1 / prefNum;
            }
        });
    }

    /** Adds the given student to the given section by adding the sectionID to the the studentStats.assignments object,
     * adding the student's id to the section.students set, and reducing the section's cap. Also updates several of the
     * section's stats from student info. */
    function addStudentToSection(student, section) {
        // Necessary stuff
        studentStats.assignments[student["ID"]] = section["Core Section #"];
        section.students.add(student["ID"]);
        section["Student Cap"] -= 1;
        // Stats
        section.stats.numStudents++;
        section.stats.numMales += (student["Sex"] == "M") ? 1 : 0;
        section.stats.numFemales += (student["Sex"] == "F") ? 1 : 0;
        section.stats.numAthletes += (student["Athlete"] == "Y") ? 1 : 0;
    }

    /** Handles the section csv file uploading. */
    function handleSectionFile() {
        sectionStats = resetSectionStatistics();
        sectionsHandled = false;
        handleRunButton();
        let file = document.getElementById("upload_section").files[0];
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: 'greedy',
            step: function (results) {
                if (results.errors.length > 0) {
                    console.log("ERRORS:", results.errors);
                    alert("An error occurred while handling the sections csv file: " + results.errors);
                    return;
                }
                let section = results.data[0];
                processSection(section);                
            },
            complete: function (results, file) {
                addStatsToElement(document.getElementById("sections_container"), getInitialSectionStatsString());
                sectionsHandled = true;
                document.getElementById("upload_student").disabled = false;
                handleRunButton();  // checks to see if students are handled too
            }
        });
    }

    /** Updates the section stats object */
    function processSection(section) {
        if (sectionStats.IDs.has(section["Core Section #"])) {
            sectionStats.duplicateIDs.add(section["Core Section #"]);
        }
        else {
            let sectionNum = section["Core Section #"];
            sectionStats.IDs.add(sectionNum);
            sectionStats.numSections += 1;
            sectionStats.numSeats += section["Student Cap"];
            sectionStats.professors.add(section["Professor"]);
            sectionStats.sections[sectionNum] = createNewSection(section);
        }
    }

    /** Toggles the state of the 'run' button based on the states of studentsHandled and sectionsHandled. */
    function handleRunButton() {
        document.getElementById("save_as").disabled = true;
        document.getElementById("run").disabled = !(studentsHandled && sectionsHandled);
    }


    /** Runs the program; filters out preassigned students, build seats for the remaining students, runs the algorithm
     * on unassigned students, combines the results, and displays a report of the results to the user. */
    function runProgram() {
        document.getElementById("run").disabled = true;
        document.getElementById("save_as").disabled = false;

        // Do algorithm stuff
        let seats = buildSeatObjects(sectionStats.sections);  // now uses the provided section to build seats
        let costMatrix = buildCostMatrix(seats, studentStats.unassigned);
        let allocations = runCostMatrix(costMatrix);
        makeAssignments(allocations, seats, studentStats.unassigned);  // updates studentStats.assignments

        // Display result stats to the user
        reportResults();

        document.getElementById("run").disabled = false;
        document.getElementById("save_as").disabled = false;
    }

    /** Returns a set of section IDs from the student's 'Illegal Sections'. " */
    function getIllegalSections(student) {
        let illegalIDs = new Set();
        let illegal_str = student["Illegal Sections"];
        let sectionIDs = illegal_str.replace(' ', '').replace('"', '').split(',');
        sectionIDs.forEach(id => {
            if (sectionStats.IDs.has(id)) {
                illegalIDs.add(id);
            }
        });
        return illegalIDs;
    }
    

    /** Given a student and a set sectionIDs where:
     *      sectionIDs: the IDs of all sections
     * Adjusts the student's preferences so that every ID in their preferences is unique and present in the sectionIDs set. 
     * Returns true if there was an error in the student's preferences, false otherwise.  */
    function adjustStudentPrefErrors(student) {
        let legal = true;
        let prefIDs = getPreferenceIDs(student);
        let arr = [];
        let dup = new Set();
        for (let i = 0; i < prefIDs.length; i++) {
            let currID = prefIDs[i];
            if (dup.has(currID) || !sectionStats.IDs.has(currID) || student["Illegal Sections"].has(currID)) legal = false;
            else arr.push(currID);
            dup.add(currID);
        }
        if (!legal) setPreferences(student, arr);
        return !legal || arr.length != 6;
    }

    // TODO: Account for preassigned students! (At least male/female. Athletes might be more tricky)
    /** Builds an object to hold an array of seats. Each seat has three main properties:
     * reserved: true if the seat is reserved for a specific sex of student, false otherwise.
     * sex: Either "M", "F", or "". Indicates the sex of student that the seat is reserved for.
     * section: A string which identifies the section this seat belongs to. */
    function buildSeatObjects(sectionsObj) {
        // Define a seats array
        let seatsArray = [];

        // Iterate through all of the sections (I hope this does so in order, otherwise we'll have issues later)
        Object.keys(sectionsObj).forEach(function (key, _) {
            let currentSection = sectionsObj[key];

            // Total number of seats in this section
            let numSeats = currentSection["Student Cap"];

            // Total number of seats to be allocated for male, female, non-sexed
            let numMaleSeats = Math.round(numSeats * getMaleRatioInput());
            let numFemaleSeats = Math.round(numSeats * getFemaleRatioInput());
            let numNonSexedSeats = numSeats - numMaleSeats - numFemaleSeats;

            // Number of non-athletes seats to be allocated for male, female, non-sexed
            let numMaleNonAthleteSeats = Math.round(numMaleSeats * (1 - getAthleteRatioInput()));
            let numFemaleNonAthleteSeats = Math.round(numFemaleSeats * (1 - getAthleteRatioInput()));
            let numNonSexedNonAthleteSeats = Math.round(numNonSexedSeats * (1 - getAthleteRatioInput()));

            // Reserve seats for male students
            for (let i = 0; i < numMaleNonAthleteSeats; i++) {
                seatsArray.push({
                    reserveSex: true,  // Check other parameters
                    sex: "M",  // Sex of the student to take this seat
                    reserveNonAthlete: true, // Reserve the seat for a non-athlete student
                    section: currentSection  // The section containing this seat
                });
            }
            for (let i = 0; i < numMaleSeats - numMaleNonAthleteSeats; i++) {
                seatsArray.push({
                    reserveSex: true,
                    sex: "M",
                    reserveNonAthlete: false,
                    section: currentSection
                });
            }

            // Reserve seats for female students
            for (let i = 0; i < numFemaleNonAthleteSeats; i++) {
                seatsArray.push({
                    reserveSex: true,
                    sex: "F",
                    reserveNonAthlete: true,
                    section: currentSection
                });
            }
            for (let i = 0; i < numFemaleSeats - numFemaleNonAthleteSeats; i++) {
                seatsArray.push({
                    reserveSex: true,
                    sex: "F",
                    reserveNonAthlete: false,
                    section: currentSection
                });
            }

            // Add seats not reserved by sex, but partially reserved for non-athletes
            for (let i = 0; i < numNonSexedNonAthleteSeats; i++) {
                seatsArray.push({
                    reserveSex: false,
                    sex: "",
                    reserveNonAthlete: true,
                    section: currentSection
                });
            }
            for (let i = 0; i < numNonSexedSeats - numNonSexedNonAthleteSeats; i++) {
                seatsArray.push({
                    reserveSex: false,
                    sex: "",
                    reserveNonAthlete: false,
                    section: currentSection
                });
            }
        });

        // Return the seats array
        return seatsArray;
    }

    /** Constructs the cost matrix based on user-input parameters and the students/sections arrays. Returns a matrix of
     * weights which represent the cost of assigning the student (represented by a row) to a seat in a class
     * (represented by individual columns, stacked sequentially). */
    function buildCostMatrix(seats, studentsObj) {
        let matrix = [];
        Object.keys(studentsObj).forEach(function (key, _) {  // Real students
            let arr = [];
            for (let i = 0; i < seats.length; i++) {
                arr.push(getStudentCostForSeat(studentsObj[key], seats[i]));
            }
            matrix.push(arr);
        });
        for (let i = 0; i < seats.length - Object.keys(studentsObj).length; i++) {  // Placeholder students
            let arr = [];
            for (let j = 0; j < seats.length; j++) {
                arr.push(getStudentCostForSeat({}, seats[j]));
            }
            matrix.push(arr);
        }
        return matrix;
    }

    /** Returns the cost associated with assigning the given student to the given section. Encodes information about
     * the maximum class size, minimum sex ratios, and maximum athlete ratio into the seats for each section*/
    function getStudentCostForSeat(student, seat) {
        if (seat.reserveSex || seat.reserveNonAthlete) {
            if (student === {}) return illegalCost;
            if (seat.reserveSex && seat.sex !== student["Sex"]) return illegalCost;
            if (seat.reserveNonAthlete && student["Athlete"] == "Y") return illegalCost;
        }
        if (student === {}) return defaultCost;
        let prefNum = getPreferenceNumber(student, seat.section["Core Section #"]);
        if (prefNum == 0) return defaultCost;
        if (prefNum == -1) return illegalCost;
        return Math.pow(costBase, prefNum);
    }

    /** Returns an integer (1-6) corresponding to the position of the given section in the student's preferences. If the
     * section is not in the student's preferences, then the function returns 0. Note: students are allowed six
     * preferences, and it is assumed that students do not list section id's more than once in their preferences. */
    function getPreferenceNumber(student, sectionID) {
        try {
            let illegal = student["Illegal Sections"];
            if (illegal.has(sectionID)) {
                return -1;
            }
        }
        catch (e) {
            // console.log(student);  // probably undefined
        }
        for (let i = 1; i < 7; i++) {
            if (student["Choice " + i] === sectionID || student["Choice " + i] === "any") {
                return i;
            }
        }
        return 0;  // section not in student's preferences
    }


    /** Returns an array of the student's preferences. */
    function getPreferenceIDs(student) {
        let prefIDs = [];
        for (let i = 1; i <= 6; i++) {
            prefIDs.push(student["Choice " + i]);
        }
        return prefIDs;
    }


    /** Modifies the student's preferences to the given prefIDs array. */
    function setPreferences(student, prefIDs) {
        for (let i = 1; i < prefIDs.length; i++) {
            student["Choice " + i] = prefIDs[i-1];
        }
        for (let i = prefIDs.length; i <= 6; i++) {
            student["Choice " + i] = "any";
        }
    }


    /** Run the Munkres/Hungarian algorithm on the cost matrix. */
    function runCostMatrix(costMatrix) {
        return new Munkres().compute(costMatrix);
    }

    /** Given the allocations from the hungarian algorithm, interpret the results for unassigned students and make the
     * assignment */
    function makeAssignments(allocations, seats, studentsObj) {
        let i = 0;
        Object.keys(studentsObj).forEach(function (key, _) {
            let index = allocations[i++][1];  // The allocation is the second entry
            let assignedSection = seats[index].section;
            addStudentToSection(studentsObj[key], assignedSection);
        });
    }

    /** Gets the number of students who were assigned their top choice, second, third, etc. Index 0 in the returned array
     * is the number of students who didn't get any of their preferences. */
    function calculateAllocationsPerformance(allocations, dataSource) {
        let data = [0, 0, 0, 0, 0, 0, 0];  // 0: None, 1-6: preference
        Object.keys(allocations).forEach(function (studentID, _) {
            let student = dataSource[studentID];
            let sectionID = allocations[studentID];
            data[getPreferenceNumber(student, sectionID)]++;
        });
        return data;
    }

    /** Adds the string to the element in a <p> tag and adds the 'report-text' class for styling. */
    function addStatsToElement(parentElement, statsString) {
        let stats = document.createElement("p");
        stats.className = "report-text";
        stats.innerHTML = statsString;
        parentElement.appendChild(stats);
    }

    /** Reads section popularity data from sectionStats.section.stats.popularity (created while reading student preferences)
     * and displays a bar chart of the relative popularity of all the sections found in sectionStats.sections. Popularity 
     * is calculated as the sum across all students of {(1 / pref#) if the section is in the student's preferences, else (0)}. */
    function addPopularityChart(parentElement) {
        let labels = Object.keys(sectionStats.sections);
        let data = Object.keys(sectionStats.sections).reduce((arr, key) => {
            arr.push(Math.round(sectionStats.sections[key].stats.popularity));
            return arr;
        }, []);
        createSectionChart(parentElement, labels, data, "Section Popularity");
    }

    /** Creates a stacked bar chart depicting the sex balance for every section. */
    function addStackedSexChart(parentElement) {
        let labels = Object.keys(sectionStats.sections);
        let males = Object.keys(sectionStats.sections).reduce((arr, key) => {
            let section = sectionStats.sections[key];
            arr.push(Math.round(100 * section.stats.numMales / section.stats.numStudents));
            return arr;
        }, []);
        let females = males.reduce((arr, amt) => {
            arr.push(100 - amt);
            return arr;
        }, []);
        let chart = document.createElement('canvas');
        chart.width = 3;
        chart.height = 1;
        parentElement.appendChild(chart);
        let context = chart.getContext('2d');
        new Chart(context, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Females",
                        data: females,
                        backgroundColor: 'rgba(255, 60, 10, 0.2)',
                        borderColor: 'rgba(255, 60, 10, 1)',
                        borderWidth: 1
                    },
                    {
                        label: "Males",
                        data: males,
                        backgroundColor: 'rgba(10, 161, 255, 0.2)',
                        borderColor: 'rgba(10, 161, 255, 1)',
                        borderWidth: 1
                    },
                ]
            },
            options: {
                title: {
                    display: true,
                    text: "Section Sex Composition (% Female and % Male)",
                },
                scales: {
                    xAxes: [{ stacked: true }],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        },
                        stacked: true
                    }]
                },
                legend: {
                    display: false
                },
            }
        });
    }

    /** Creates a bar chart for athlete distribution across sections. */
    function addAthleteChart(parentElement) {
        let labels = Object.keys(sectionStats.sections);
        let athletes = Object.keys(sectionStats.sections).reduce((arr, key) => {
            let section = sectionStats.sections[key];
            arr.push(Math.round(100 * section.stats.numAthletes / section.stats.numStudents));
            return arr;
        }, []);
        createSectionChart(parentElement, labels, athletes, "Athlete Balance (% Athletes)");
    }

    /** Creates a chart element under the parent element and populates the chart with the given labels, data, and title. */
    function createSectionChart(parentElement, labels, data, title) {
        let chart = document.createElement('canvas');
        chart.width = 3;
        chart.height = 1;
        parentElement.appendChild(chart);
        let context = chart.getContext('2d');
        createChart(context, labels, data, title);
    }

    /** Takes a report object and makes it look nice in html. */
    function reportResults() {
        // Run container
        let parentElement = document.getElementById('run_container');

        // Choice Labels
        let choice_labels = ['None', 'Choice 1', 'Choice 2', 'Choice 3', 'Choice 4', 'Choice 5', 'Choice 6'];

        // Overall 
        let overall = calculateAllocationsPerformance(studentStats.assignments, studentStats.students);
        choiceDistributionChart(parentElement, choice_labels, overall, "Allocations (All)");

        // Preassigned
        // if (studentStats.stats.preassignedIDs.size > 0) {
        //     let preassigned = calculateAllocationsPerformance(studentStats.preassigned, studentStats.students);
        //     choiceDistributionChart(parentElement, choice_labels, preassigned, "Allocations (Only Pre-Assigned)");
        // }

        // Sex
        addStackedSexChart(parentElement);

        // Athlete
        addAthleteChart(parentElement);
    }

    /** Returns a string with info from the studentStats object. */
    function getInitialStudentStatsString() {
        let stats = `
            There are ${studentStats.stats.numStudents} students in total;
            ${studentStats.stats.numFemales} are female (${Math.round(100*studentStats.stats.numFemales/studentStats.stats.numStudents)}%) and
            ${studentStats.stats.numMales} are male (${Math.round(100*studentStats.stats.numMales/studentStats.stats.numStudents)}%).
            Of those students, ${studentStats.stats.numAthletes} are athletes (${Math.round(100*studentStats.stats.numAthletes/studentStats.stats.numStudents)}%).
            There are ${studentStats.stats.numPreAssigned} students who have already been assigned sections.
        `;
        if (studentStats.stats.numPreferenceErrors > 0) stats += `<br><br>WARNING: ${studentStats.stats.numPreferenceErrors} students did not list exactly 6 legal preferences. These students are: <blockquote>${Array.from(studentStats.stats.errorIDs).sort().join(', ')}</blockquote>`;
        if (studentStats.stats.duplicateIDs.size > 0) stats += `<br><br>ERROR: The students with IDs ${Array.from(studentStats.stats.duplicateIDs).join(', ')} are present more than once. Please resolve this before proceeding.`
        return stats;
    }


    /** Returns a string with info from the sectionStats object. */
    function getInitialSectionStatsString() {
        let stats = `
            There are ${sectionStats.numSections} sections taught by ${sectionStats.professors.size} professors.
            There are ${sectionStats.numSeats} total seats available.
        `;
        if (sectionStats.duplicateIDs.size > 0) stats += `<br><br>ERROR: The sections with IDs ${Array.from(sectionStats.duplicateIDs).join(', ')} are present more than once. Please resolve this before proceeding`;
        return stats;
    }

    /** Populates the given canvas with the given distribution, background colors, and border colors. */
    function choiceDistributionChart(parentElement, labels, distribution, title) {
        let chart = document.createElement('canvas');
        chart.width = 3;
        chart.height = 1;
        parentElement.appendChild(chart);
        let context = chart.getContext('2d');
        return new Chart(chart, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: distribution,
                    backgroundColor: [
                        'rgba(234, 10, 255, 0.2)',
                        'rgba(63, 10, 255, 0.2)',
                        'rgba(10, 161, 255, 0.2)',
                        'rgba(10, 255, 177, 0.2)',
                        'rgba(14, 255, 10, 0.2)',
                        'rgba(255, 222, 10, 0.2)',
                        'rgba(255, 10, 10, 0.2)',
                    ],
                    borderColor: [
                        'rgba(234, 10, 255, 1)',
                        'rgba(63, 10, 255, 1)',
                        'rgba(10, 161, 255, 1)',
                        'rgba(10, 255, 177, 1)',
                        'rgba(14, 255, 10, 1)',
                        'rgba(255, 222, 10, 1)',
                        'rgba(255, 10, 10, 1)',
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                title: {
                    display: true,
                    text: title,
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                },
                legend: {
                    display: false
                },
            }
        });
    }

    /** Semi-abstract method for creating a chart. Requires the context to attach the chart to, labels and data, and a title. */
    function createChart(context, labels, data, title, type='bar') {
        return new Chart(context, {
            type: type,
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: 'rgba(10, 161, 255, 0.2)',
                    borderColor: 'rgba(10, 161, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                title: {
                    display: true,
                    text: title,
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            suggestedMin: 0,
                            suggestedMax: 100,
                        }
                    }]
                },
                legend: {
                    display: false
                },
            }
        });
    }

    /** Saves the allocations to a csv file when the user clicks the "Save" button. Note the save path is specified by
     * the user's browser. */
    function saveResults() {
        // Convert the allocations object to an array
        let results = ["Student ID,Core Section #"];  // Headers
        Object.keys(studentStats.assignments).forEach(function (key, _) {
            if (studentStats.students[key]["Illegal Sections"].has(studentStats.assignments[key])) {
                console.log(studentStats.students[key]);
            }
            results.push(key + "," + studentStats.assignments[key]);
        });
        let data = results.join("\n");
        let blob = new Blob([data], {type: "text/csv;charset=utf-8"});  // Save the string to a new file. Note: Not possible to open save as dialog box through javascript.
        saveAs(blob, "sortedhat.csv");  // from js/file-saver
    }


    /** Returns the maximum permitted female ratio in any section from the input slider. */
    function getFemaleRatioInput() {
        return document.getElementById("female_ratio_input").value / 100;
    }


    /** Returns the maximum permitted male ratio in any section from the input slider. */
    function getMaleRatioInput() {
        return document.getElementById("male_ratio_input").value / 100;
    }


    /** Returns the maximum permitted athlete ratio in any section from the input slider. */
    function getAthleteRatioInput() {
        return document.getElementById("athlete_ratio_input").value / 100;
    }

};
