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


    /** Objects to keep track of the students and sections data filtered from the original inputs. These are used as
     * inputs in the hungarian/munkres algorithm. */
    let studentsData = {};  // ID: "ID"
    let sectionsData = {};  // ID: "Core Section #"


    /** The sum of the class limits minus the number of pre-assigned students. This is the number of columns in the cost
     * matrix, each of which represents a "job" for the hungarian algorithm to allocate. */
    let numAvailableSeats;


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

        // TODO: Compute size of the cost matrix & optionally handle obvious errors
        // TODO: Implement mapping of column index (seat) to section // DONE: Column index = seat index
        // TODO: Implement construction of cost matrix
        // TODO: Implement or borrow hungarian/munkres algorithm for allocations
        // TODO: Retrieve allocations from algorithm
        // TODO: Generate a report of the program's performance
        // TODO: Activate the save button
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
    function buildCostMatrix() {
        /* Define parameters for the cost matrix based on user-defined configurations. */
        let alpha = 3.5;
        let defaultWeight = Math.pow(alpha, 7);
        let illegalWeight = Math.pow(alpha, 9);
        let minFemaleRatio = 1 - getFemaleRatioInput();
        let minMaleRatio = 1 - getMaleRatioInput();
        let minNonAthleteRatio = 1 - getAthleteRatioInput();


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