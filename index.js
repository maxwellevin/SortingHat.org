"use strict";

window.onload = function () {

    /** Add event listeners for "Choose File" buttons */
    document.getElementById("upload_student").onchange = handleStudentFile;
    document.getElementById("upload_section").onchange = handleSectionFile;
    document.getElementById("run").onclick = runProgram;


    /** Boolean values to track handling of students and sections. */
    let studentsHandled = false;
    let sectionsHandled = false;


    /** Arrays to keep track of the students and sections data parsed from csv inputs. */
    let studentsData = [];
    let sectionsData = [];


    /** Handles the student csv file uploading. */
    function handleStudentFile() {
        studentsHandled = false;
        handleRunButton();
        let file = document.getElementById("upload_student").files[0];
        let arr = [];
        Papa.parse(file, {
            header: true,
            step: function (results) {
                if(results.errors.length > 0) {
                    // TODO: Better handle errors
                    console.log("ERRORS:", results.errors);
                    return;
                }
                arr.push(results.data[0]);
            },
            complete: function (results, file) {
                studentsData = arr;
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
        let arr = [];
        Papa.parse(file, {
            step: function (results) {
                if(results.errors.length > 0) {
                    // TODO: Better handle errors
                    console.log("ERRORS:", results.errors);
                    return;
                }
                arr.push(results.data[0]);
            },
            complete: function (results, file) {
                sectionsHandled = true;
                sectionsData = arr;
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
        console.log("Starting to run");
        console.log(studentsData)
        // TODO: Compute size of the cost matrix & optionally handle obvious errors
        // TODO: Implement mapping of column index (seat) to section
        // TODO: Implement construction of cost matrix
        // TODO: Implement or borrow hungarian/munkres algorithm for allocations
        // TODO: Retrieve allocations from algorithm
        // TODO: Generate a report of the program's performance
        // TODO: Activate the save button
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