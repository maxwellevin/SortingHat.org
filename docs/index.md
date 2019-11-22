---
title: SortingHat Docs
subtitle: Welcome to the docs!
layout: default
---

Welcome to the SortingHat docs! Here you'll find instructions on how to run the program as well as what kind of outputs you should expect to see. 

To report a problem, view the source code, or submit a pull request, checkout the [github repo](https://github.com/1800Blarbo/SortingHat.org).


## Instructions

### Step 1: Upload the Sections File

Click the "Choose file" button under the sections tab to upload a csv containing information about sections. This file must have the following headers (order does not matter):

* "Core Section #" - the unique identifier for the given section. 
* "Professor" - the primary instructor for the section.
* "Student Cap" - the number of students allowed to take the class. 

Presently no additional headers are supported. 

### Step 2: Upload the Students File

Click the "Choose file" button under the students tab to upload a csv containing information about students. This file must have the following headers (order does not matter):

* "ID" - a unique identifier for a student
* "Sex" - the student's sex. Must be one of "M" or "F"
* "Athlete" - indicates if the student is involved with an athletics program. Should be "Y" if the student is an athlete
* "Choice 1", "Choice 2", ..., "Choice 6" - the Core Section #s of the student's top choices.
* "Placement" - the Core Section # of the section the student has been assigned to. This allows the user to make course allocations prior to running SortingHat. 
* "Illegal Sections" - a list of Core Section #s that the student is not allowed to take.  It is highly unlikely that a student will be placed in an illegal section. The list may contain as many Core Section #s as you want as long as they are enclosed in quotes and separated by commas. Ex: "Core-19, Core-20" is valid, but "Core-19 Core-20" is not.

Other headers and columns are permitted to be in the student csv file, but the program will not be able to use data from columns that have headers named something other than what is specified above.

### Step 3: Set Minimum Sex Ratios

SortingHat offers users the ability to control certain aspects of how students are distributed in classes. One such aspect is the ability to set rough minimum sex ratio for males/females in any section. By moving the sliders users can set a rough minimum percentage of males or females that each section should be composed of. Note that these are rough minimums -- because these are percentages and the number of students allowed in a class is a whole number, the actual results are not guaranteed to match exactly. Some tinkering may be required to get these exactly right. Fortunately, SortingHat reports the sex distribution outcome of each section, so you will know exactly which sections require additional attention.

### Step 4: Set Maximum Athlete Ratio

Users are also given the option of controlling the maximum percentage of student-athletes in a section by adjusting the Athlete slider. Note that this is not an exact guarantee, but it get very close to your target almost all of the time. SortingHat also reports the athlete distribution of individual sections after running so you can see the exact problem areas.

### Step 5: Run the Program

Click the "Run" button to run the program. This typically takes less than 10 seconds, but may the time taken will vary based on the number of students and sections provided. Upon determining an optimal allocation the program will output a brief summary of the results below the page. If the results are not satisfactory, you may try tinkering with the sliders until the results are more acceptable, or use the information provided by the charts to manually adjust the results. At it's current state SortingHat requires that you reload the page in order to run the program again with different settings. 

### Step 6: Save the Results

When the results are satisfactory, click on the "Save" button to save the results to a local file. The file will be a csv with the following headers:

* "Student ID" - the ID of the student according to "ID" in the csv file pertaining to students.
* "Core Section #" - the ID of the section the student has been assigned to.

In the future, the following headers may be made available:

* "Choice" - an integer (1 - 6) indicating which choice of section the student received. If empty, the student was allocated to a section not in their preferences. This can happen when a student does not list sufficient preferences or when a student's preferences are all illegal.
