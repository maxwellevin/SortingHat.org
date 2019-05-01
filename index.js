"use strict";

window.onload = function () {

    /** Add event listeners for "Choose File" buttons */
    document.getElementById("upload_student").onchange = handleStudentFile;
    document.getElementById("upload_section").onchange = handleSectionFile;


    /** Boolean values to track handling of students and sections. */
    let studentsHandled = false;
    let sectionsHandled = false;


    /** Handles the student csv file uploading. */
    function handleStudentFile() {
        studentsHandled = false;
        handleRunButton();
        let file = document.getElementById("upload_student").files[0];
        Papa.parse(file, {
            step: function (results) {
                // TODO: Build students array
                console.log("Row:", results.data);
            },
            complete: function (results) {
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
        Papa.parse(file, {
            step: function (results) {
                // TODO: Build sections array
                console.log("Row:", results.data);
            },
            complete: function (results) {
                sectionsHandled = true;
                handleRunButton();  // checks to see if students are handled too
            }
        });
        console.log("Picked Section File");
    }


    /** Toggles the state of the 'run' button based on the states of studentsHandled and sectionsHandled. */
    function handleRunButton() {
        if (studentsHandled && sectionsHandled) {
            document.getElementById("run").disabled = false;
        } else {
            document.getElementById("run").disabled = true;
        }
    }


    /** Returns the maximum permitted female ratio in any section from the input slider.*/
    function getFemaleRatioInput() {
        return document.getElementById("female_ratio_input").value / 100;
    }


    /** Returns the maximum permitted male ratio in any section from the input slider.*/
    function getMaleRatioInput() {
        return document.getElementById("male_ratio_input").value / 100;
    }


    /** Returns the maximum permitted athlete ratio in any section from the input slider.*/
    function getAthleteRatioInput() {
        return document.getElementById("athlete_ratio_input").value / 100;
    }
};