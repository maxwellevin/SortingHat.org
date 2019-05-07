"use strict";

// TODO: Generate a report of the program's performance
// TODO: Activate the save button

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


    /** Objects to keep track of the students and sections data filtered from the original inputs. These are used as
     * inputs in the hungarian/munkres algorithm. */
    let studentsData = {};  // ID: "ID"
    let sectionsData = {};  // ID: "Core Section #"

    /** The results of the hungarian/munkres algorithm. This is an object with a key of student id and a value of their
     * assigned section. */
    let allocations = {};


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
                    // TODO: Better handle errors
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
                    // TODO: Better handle errors
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
        if (studentsHandled && sectionsHandled) {
            document.getElementById("run").disabled = false;
        } else {
            document.getElementById("run").disabled = true;
        }
    }


    /** Launches the meat of the program and reports the results. */
    function runProgram() {
        document.getElementById("run").disabled = true;

        let preassignedStudents = filterInputData();
        console.log("The following students have already been assigned sections:");
        console.log(preassignedStudents);

        let seats = buildSeatObjects();
        console.log("The following seats have been prepared:");
        console.log(seats);

        let costMatrix = buildCostMatrix(seats);
        console.log("The cost matrix has been built:");
        console.log(costMatrix);

        let allocations = getAllocations(costMatrix, seats);
        console.log("The hungarian algorithm has been run. The allocations are:");
        console.log(allocations);

        document.getElementById("run").disabled = false;
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
                preassignedStudents[key] = student;
                let sectionKey = student["Placement"];
                sectionsData[sectionKey]["Student Cap"] -= 1;
            }
            // If they haven't already been assigned, (hard) copy them to a new object to use with the algorithm.
            else {
                studentsData[key] = Object.assign([], student);
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
            let numSeats = currentSection["Student Cap"];

            // Reserve a number of seats for males:
            let numMaleSeats = Math.round(numSeats * (1 - getMaleRatioInput()));
            for (let i = 0; i < numMaleSeats; i++) {
                seatsArray.push({
                    reserved: true,
                    gender: "M",
                    section: currentSection
                });
            }

            // Reserve a number of seats for females
            let numFemaleSeats = Math.round(numSeats * (1 - getFemaleRatioInput()));
            for (let i = 0; i < numFemaleSeats; i++) {
                seatsArray.push({
                    reserved: true,
                    gender: "F",
                    section: currentSection
                });
            }

            // Push the final seats to the seatsArray
            for (let i = 0; i < numSeats - numMaleSeats - numFemaleSeats; i++) {
                seatsArray.push({
                    reserved: false,
                    gender: "",
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

        // Define parameters for the cost matrix based on user-defined configurations.
        let alpha = 3.5;
        let defaultWeight = Math.pow(alpha, 7);
        let illegalWeight = Math.pow(alpha, 9);

        // Loop through the students
        Object.keys(studentsData).forEach(function (key, index) {
            let student = studentsData[key];
            let arr = [];

            // Loop through the seats
            for (let i = 0; i < seats.length; i++) {
                let seat = seats[i];

                // Get how desirable the seat is for the student
                let prefNum = getPreferenceNumber(student, seat.section["Core Section #"]);  // TODO: make this use ID

                // Determine if the student is not eligible or willing to take the seat
                if (!prefNum || (seat.reserved && (student["Gender"] !== seat.gender))) {
                    arr[i] = illegalWeight;
                    continue;
                }

                // Set the cost according to the student's preferences.
                arr[i] = Math.pow(alpha, prefNum);
            }

            // Push the student's costs to the cost matrix
            matrix.push(arr);
        });

        // Loop through the dummy students (Placeholders)
        for (let i = 0; i < seats.length - Object.keys(studentsData).length; i++) {
            let arr = [];

            // Loop through the seats
            for (let j = 0; j < seats.length; j++) {
                let seat = seats[j];

                // If the seat is gendered, it should be reserved for actual students.
                if (seat.reserved) {
                    arr[j] = illegalWeight;
                    continue;
                }

                // All other seats should have a cost greater than any potential seats for students.
                arr[j] = defaultWeight;
            }

            // Push the dummy student's costs to the cost matrix
            matrix.push(arr);
        }

        // Return the cost matrix
        return matrix;
    }


    /** Runs the hungarian algorithm on the given matrix and returns the allocations. An allocation is an object where
     * the key is the student's id and the values are pointers to the student's object and the allocated section's
     * object. */
    function getAllocations(matrix, seats) {
        // Initialize the allocations object
        allocations = {};

        // Run the Munkres/Hungarian algorithm on the cost matrix
        let indices = new Munkres().compute(matrix);

        // Loop through the students data
        let i = 0;
        Object.keys(studentsData).forEach(function (key, _) {
            let currentStudent = studentsData[key];
            let index = indices[i++][1];  // The allocation is the second entry
            let assignedSection = seats[index].section;

            // Build the objects
            allocations[currentStudent["ID"]] = {
                section: assignedSection
            };
        });

        // Return the results
        return allocations;

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
        return false;
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


    /** Saves the results of the program upon a successful run of the algorithm. */
    function saveResults() {
        // TODO: Save the results to a csv file of the user's designation
    }
};