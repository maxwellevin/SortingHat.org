"use strict";

window.onload = function () {

    /** LARS: Feel free to change the names of these functions. I'm just writing stubs to get organized for now. - Max*/
    // Add event listeners for "Choose File" buttons
    document.getElementById("upload_student").onclick = handleStudentFile;
    document.getElementById("upload_section").onclick = handleSectionFile;


    /** Handles the student csv file uploading. */
    function handleStudentFile() {
        let file = chooseFile();
        return -1;
    }

    /** Handles the section csv file uploading. */
    function handleSectionFile() {
        let file = chooseFile();
        return -1;
    }

    /** Handles user interaction with opening a new file. Maybe returns the path to the file, or actually loads the file in memory.*/
    function chooseFile() {
        return -1;
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
}