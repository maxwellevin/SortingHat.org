"use strict";

window.onload = function () {

    /** Add event listeners for actionable buttons */
    document.getElementById("upload_student").onchange = handleStudentFile;
    document.getElementById("upload_section").onchange = handleSectionFile;
    document.getElementById("run").onclick = runProgram;
    document.getElementById("save_as").onclick = saveResults;


    /** Boolean values to track handling of students and sections. */
    let studentsHandled = false;
    let sectionsHandled = false;


    /** Objects to keep track of the students and sections data parsed from csv inputs. */
    let initialStudentsData = {};  // ID: "ID"
    let initialSectionsData = {};  // ID: "Core Section #"


    /** Object to keep track of the students who have been assigned a section prior to running the script. */
    let preassignedStudents = {};


    /** Objects to keep track of the students and sections data filtered from the original inputs. These are used as
     * inputs in the hungarian/munkres algorithm. */
    let studentsData = {};  // ID: "ID"
    let sectionsData = {};  // ID: "Core Section #"


    /** The results of the hungarian/munkres algorithm. This is an object with a key of student id and a value of the
     * student's assigned section number. */
    let munkres = {};


    /** The results of the hungarian/munkres algorithm combined with the existing allocations. This is an object with a
     * key key of student id and a value of the student's assigned section number. */
    let allocations = {};


    /** Define parameters for the cost matrix based on user-defined configurations. */
    let costBase = 3.5;
    let defaultCost = Math.pow(costBase, 7);
    let illegalCost = Math.pow(costBase, 9);


    /** Handles the student csv file uploading. */
    function handleStudentFile() {
        studentsHandled = false;
        handleRunButton();
        let file = document.getElementById("upload_student").files[0];
        let arr = {};
        Papa.parse(file, {
            header: true,
            step: function (results) {
                if (results.errors.length > 0) {
                    console.log("ERRORS:", results.errors);
                    alert("An error occurred while handling the student csv file: " + results.errors);
                    return;
                }
                let student = results.data[0];
                arr[student["ID"]] = student;
            },
            complete: function (results, file) {
                initialStudentsData = arr;
                studentsHandled = true;
                handleRunButton();  // checks to see if sections are handled too
            }
        });
    }


    /** Handles the section csv file uploading. */
    function handleSectionFile() {
        sectionsHandled = false;
        handleRunButton();
        let file = document.getElementById("upload_section").files[0];
        let arr = {};
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            step: function (results) {
                if (results.errors.length > 0) {
                    console.log("ERRORS:", results.errors);
                    alert("An error occurred while handling the sections csv file: " + results.errors);
                    return;
                }
                let section = results.data[0];
                arr[section["Core Section #"]] = section;
            },
            complete: function (results, file) {
                sectionsHandled = true;
                initialSectionsData = arr;
                handleRunButton();  // checks to see if students are handled too
            }
        });
    }


    /** Toggles the state of the 'run' button based on the states of studentsHandled and sectionsHandled. */
    function handleRunButton() {
        document.getElementById("save_as").disabled = true;
        document.getElementById("run").disabled = !(studentsHandled && sectionsHandled);
    }


    /** Launches the meat of the program and reports the results. */
    function runProgram() {
        document.getElementById("run").disabled = true;

        preassignedStudents = filterInputData();
        console.log("The following students have already been assigned sections:");
        console.log(preassignedStudents);

        let seats = buildSeatObjects();
        console.log("The following seats have been prepared:");
        console.log(seats);

        let costMatrix = buildCostMatrix(seats);
        console.log("The cost matrix has been built:");
        console.log(costMatrix);

        munkres = getAllocations(costMatrix, seats);
        console.log("The hungarian algorithm has been run. The allocations are:");
        console.log(munkres);

        // Combine the algorithm's allocations with previous allocations
        allocations = combineAllocations(munkres, preassignedStudents);

        let report = createReport();
        printReport(report);

        document.getElementById("run").disabled = false;
        document.getElementById("save_as").disabled = false;
    }


    /** Filters the original students and sections data to account for pre-assigned students and students with illegal
     * preferences. Updates studentsData and sectionsData global objects and returns an object for the preassigned
     * students. */
    function filterInputData() {
        let preassignedStudents = {};

        // Ensure that studentsData is empty and that sectionsData is a hard copy of the initial sections data.
        studentsData = {};
        sectionsData = Object.assign([], initialSectionsData);

        // Iterate through the students by using their keys (ID's)
        Object.keys(initialStudentsData).forEach(function (key, _) {
            let student = initialStudentsData[key];

            // For each student, check if they have already been assigned a section
            if (student["Placement"] !== "") {
                preassignedStudents[key] = student["Placement"];
                let sectionKey = student["Placement"];
                sectionsData[sectionKey]["Student Cap"] -= 1;
            }
            // If they haven't already been assigned, copy them to a new object to use with the algorithm.
            else {
                studentsData[key] = student;
            }
        });
        return preassignedStudents;
    }


    /** Builds an object to hold an array of seats. Each seat has three main properties:
     * reserved: true if the seat is reserved for a specific gender of student, false otherwise.
     * gender: Either "M", "F", or "". Indicates the gender of student that the seat is reserved for.
     * section: A string which identifies the section this seat belongs to. */
    function buildSeatObjects() {
        // Define a seats array
        let seatsArray = [];

        // Iterate through all of the sections (I hope this does so in order, otherwise we'll have issues later)
        Object.keys(sectionsData).forEach(function (key, _) {
            let currentSection = sectionsData[key];

            // Total number of seats in this section
            let numSeats = currentSection["Student Cap"];

            // Total number of seats to be allocated for male, female, non-gendered
            let numMaleSeats = Math.round(numSeats * getMaleRatioInput());
            let numFemaleSeats = Math.round(numSeats * getFemaleRatioInput());
            let numNonGenderedSeats = numSeats - numMaleSeats - numFemaleSeats;

            // Number of non-athletes seats to be allocated for male, female, non-gendered
            let numMaleNonAthleteSeats = Math.round(numMaleSeats * (1 - getAthleteRatioInput()));
            let numFemaleNonAthleteSeats = Math.round(numFemaleSeats * (1 - getAthleteRatioInput()));
            let numNonGenderedNonAthleteSeats = Math.round(numNonGenderedSeats * (1 - getAthleteRatioInput()));

            // Reserve seats for male students
            for (let i = 0; i < numMaleNonAthleteSeats; i++) {
                seatsArray.push({
                    reserveGender: true,  // Check other parameters
                    gender: "M",  // Gender of the student to take this seat
                    reserveNonAthlete: true, // Reserve the seat for a non-athlete student
                    section: currentSection  // The section containing this seat
                });
            }
            for (let i = 0; i < numMaleSeats - numMaleNonAthleteSeats; i++) {
                seatsArray.push({
                    reserveGender: true,
                    gender: "M",
                    reserveNonAthlete: false,
                    section: currentSection
                });
            }

            // Reserve seats for female students
            for (let i = 0; i < numFemaleNonAthleteSeats; i++) {
                seatsArray.push({
                    reserveGender: true,
                    gender: "F",
                    reserveNonAthlete: true,
                    section: currentSection
                });
            }
            for (let i = 0; i < numFemaleSeats - numFemaleNonAthleteSeats; i++) {
                seatsArray.push({
                    reserveGender: true,
                    gender: "F",
                    reserveNonAthlete: false,
                    section: currentSection
                });
            }

            // Add seats not reserved by gender, but partially reserved for non-athletes
            for (let i = 0; i < numNonGenderedNonAthleteSeats; i++) {
                seatsArray.push({
                    reserveGender: false,
                    gender: "",
                    reserveNonAthlete: true,
                    section: currentSection
                });
            }
            for (let i = 0; i < numNonGenderedSeats - numNonGenderedNonAthleteSeats; i++) {
                seatsArray.push({
                    reserveGender: false,
                    gender: "",
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
    function buildCostMatrix(seats) {
        let matrix = [];
        Object.keys(studentsData).forEach(function (key, _) {  // Real students
            let arr = [];
            for (let i = 0; i < seats.length; i++) {
                arr.push(getStudentCostForSeat(studentsData[key], seats[i]));
            }
            matrix.push(arr);
        });
        for (let i = 0; i < seats.length - Object.keys(studentsData).length; i++) {  // Placeholder students
            let arr = [];
            for (let j = 0; j < seats.length; j++) {
                arr.push(getStudentCostForSeat({}, seats[j]));
            }
            matrix.push(arr);
        }
        return matrix;
    }


    /** Returns the cost associated with assigning the given student to the given section. Encodes information about
     * the maximum class size, minimum gender ratios, and maximum athlete ratio into the seats for each section*/
    function getStudentCostForSeat(student, seat) {
        if (seat.reserveGender || seat.reserveNonAthlete) {
            if (student === {}) return illegalCost;
            if (seat.reserveGender && seat.gender !== student["Gender"]) return illegalCost;
            if (seat.reserveNonAthlete && student["Athlete"] != "") return illegalCost;  // broken
        }
        let prefNum = getPreferenceNumber(student, seat.section["Core Section #"]);
        if (prefNum == 0) return defaultCost;
        return Math.pow(costBase, prefNum);
    }



    /** Returns an integer (1-6) corresponding to the position of the given section in the student's preferences. If the
     * section is not in the student's preferences, then the function returns false. Note: students are allowed six
     * preferences, and it is assumed that students do not list section id's more than once in their preferences. */
    function getPreferenceNumber(student, sectionID) {
        for (let i = 1; i < 7; i++) {
            if (student["Choice " + i] === sectionID) {
                return i;
            }
        }
        return 0;  // section not in student's preferences
    }


    /** Runs the hungarian algorithm on the given matrix and returns the allocations. An allocation is an object where
     * the key is the student's id and the values are pointers to the student's object and the allocated section's
     * object. */
    function getAllocations(matrix, seats) {
        // Initialize the allocations object
        let munkres = {};

        // Run the Munkres/Hungarian algorithm on the cost matrix
        let indices = new Munkres().compute(matrix);

        // Loop through the students data
        let i = 0;
        Object.keys(studentsData).forEach(function (key, _) {
            let index = indices[i++][1];  // The allocation is the second entry
            let assignedSection = seats[index].section;

            // Build the objects
            munkres[key] = assignedSection["Core Section #"];
        });


        // Return the results
        return munkres;
    }


    /** Combines the allocations from the munkres/hungarian algorithm with the existing allocations. Returns an object
     * with student ID as a key and "Core Section #" as the value. */
    function combineAllocations(m, a) {
        let b = Object.assign({}, m);
        Object.keys(a).forEach(function (key, _) {
            b[key] = a[key];
        });
        return b;
    }


    /** Computes a number of different statistics about the allocated students. Returns an object. */
    function createReport() {
        let report = {};

        // Records % of students getting their preferences. Index 0 = not a preference, 1-6 correspond with 1-6 pref.
        let m_pref = [0, 0, 0, 0, 0, 0, 0];  // munkres preference performance
        let a_pref = [0, 0, 0, 0, 0, 0, 0];  // overall preference performance

        // Compute preference performance of the munkres allocations
        Object.keys(munkres).forEach(function (key, _) {
            let student = studentsData[key];
            let sectionID = allocations[key];
            let pref = getPreferenceNumber(student, sectionID);
            if (pref) {
                m_pref[pref]++;
            }
            else {
                m_pref[0]++;
            }
        });
        for (let i = 0; i < 7; i++) {
            m_pref[i] /= Object.keys(studentsData).length;
            m_pref[i] *= 100;
        }

        // Compute overall preference performance
        Object.keys(allocations).forEach(function (key, _) {
            let student = initialStudentsData[key];
            let sectionID = allocations[key];
            let pref = getPreferenceNumber(student, sectionID);
            if (pref) {
                a_pref[pref]++;
            }
            else {
                a_pref[0]++;
            }
        });
        for (let i = 0; i < 7; i++) {
            a_pref[i] /= Object.keys(studentsData).length;
            a_pref[i] *= 100;
        }



        console.log(m_pref);
        console.log(a_pref);
        return report;
    }


    /** Takes a report object and makes it look nice in html. */
    function printReport(report) {

    }


    /** Saves the results of the program upon a successful run of the algorithm. */
    function saveResults() {
        // Convert the allocations object to an array
        let results = ["Student ID,Core Section #"];  // Headers
        Object.keys(allocations).forEach(function (key, _) {
            results.push(key + "," + allocations[key]);
        });

        // Convert the array to a string
        let data = results.join("\n");

        // Save the string to a new file. Note: Not possible to open save as dialog box through javascript.
        let blob = new Blob([data], {type: "text/csv;charset=utf-8"});
        saveAs(blob, "sortedhat.csv");
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