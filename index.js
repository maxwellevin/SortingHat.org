"use strict";

window.onload = function () {

    // Add event listeners for "Choose File" buttons
    document.getElementById("upload_student").onchange = handleStudentFile;
    document.getElementById("upload_section").onchange = handleSectionFile;


    /** Handles the student csv file uploading. */
    function handleStudentFile() {
        let file = document.getElementById("upload_student").files[0];
        Papa.parse(file, {  // This is asynchronous so how do we actually deal with this?
            // step: function(results) {
            //     console.log("Row:", results.data);
            // },
            complete: function (results) {
                // All the magic happens here
                console.log("Finished");
            }
        });
    }


    /** Handles the section csv file uploading. */
    function handleSectionFile() {
        let file = document.getElementById("upload_section").files[0];
        Papa.parse(file, {  // This is asynchronous so how do we actually deal with this?
            complete: function (results) {
                // All the magic happens here
            }
        });
        console.log("Picked Section File");
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
};