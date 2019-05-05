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
                console.log(results);
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
        console.log("Read input data:");
        // console.log(initialStudentsData);
        // console.log(initialSectionsData);

        console.log(Object.keys(initialStudentsData));

        // These are filtered versions of the original data where pre-assigned students are removed from the students
        // array and sections are updated to reflect the student cap with pre-assigned students.
        console.log("Filtering input data:");
        filterInputData();
        // console.log(studentsData);
        // console.log(sectionsData);

        // TODO: Handle pre-assigned students
        // TODO: Compute size of the cost matrix & optionally handle obvious errors
        // TODO: Implement mapping of column index (seat) to section
        // TODO: Implement construction of cost matrix
        // TODO: Implement or borrow hungarian/munkres algorithm for allocations
        // TODO: Retrieve allocations from algorithm
        // TODO: Generate a report of the program's performance
        // TODO: Activate the save button
    }


    /** Filters the original students and sections data to account for pre-assigned students and students with illegal
     * preferences. Returns an array containing an array of students and an array of sections. */
    function filterInputData() {
        studentsData = [];
        sectionsData = Object.assign([], initialSectionsData);
        let studentKeys = Object.keys(initialStudentsData);
        // console.log(studentKeys);
        // console.log(initialStudentsData);
        Object.keys(initialStudentsData).forEach(function (key, index) {
            console.log(key);
            let student = initialStudentsData[key];
            // console.log(student);
            if (student["Placement"] !== "") {  // Student has already been assigned a section
                let sectionKey = student["Placement"];
                sectionsData[sectionKey]["Student Cap"] -= 1;
            } else {  // Student needs to be assigned a section, so they get copied
                studentsData[key] = Object.assign([], student);
            }
        });
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