# SortingHat.org
Sort students into classes with this cutting edge interface: <a href="https://www.maxwelllevin.com/sortinghat/">SortingHat</a>.


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
* "Sex" - the student's legal sex. Must be one of "M" or "F".
* "Athlete" - indicates if the student is involved with an athletics program. Should be "Y" if the student is an athlete
* "Choice 1", "Choice 2", ..., "Choice 6" - the Core Section #s of the student's top choices.
* "Placement" - the Core Section # of the section the student has been assigned to. This allows the user to make course allocations prior to running SortingHat. 
* "Illegal Sections" - a list of Core Section #s that the student is not allowed to take.  It is highly unlikely that a student will be placed in an illegal section. The list may contain as many Core Section #s as you want as long as they are enclosed in quotes and separated by commas. Ex: "Core-19, Core-20" is valid, but "Core-19 Core-20" is not.

Other headers and columns are permitted to be in the student csv file, but the program will not be able to use data from columns that have headers named something other than what is specified above.

### Step 3: Set Minimum Legal Sex Ratios

SortingHat offers users the ability to control certain aspects of how students are distributed in classes. One such aspect is the ability to set rough minimum legal sex ratios for males/females in any section. By moving the sliders users can set a rough minimum percentage of males or females that each section should be composed of. Note that these are rough minimums -- because these are percentages and the number of students allowed in a class is a whole number, the actual results are not guaranteed to match exactly. Some tinkering may be required to get these exactly right. Fortunately, SortingHat reports the gender distribution outcome of each section, so you will know exactly which sections require additional attention.

### Step 4: Set Maximum Athlete Ratio

Users are also given the option of controlling the maximum percentage of student-athletes in a section by adjusting the Athlete slider. Note that this is not an exact guarantee, but it get very close to your target almost all of the time. SortingHat also reports the athlete distribution of individual sections after running so you can see the exact problem areas.

### Step 5: Run the Program

Click the "Run" button to run the program. This typically takes less than 10 seconds, but may the time taken will vary based on the number of students and sections provided. Upon determining an optimal allocation the program will output a brief summary of the results below the page. If the results are not satisfactory, you may try tinkering with the sliders until the results are more acceptable, or use the information provided by the charts to manually adjust the results. At it's current state SortingHat requires that you reload the page in order to run the program again with different settings. 

### Step 6: Save the Results

When the results are satisfactory, click on the "Save" button to save the results as a csv file. The saved file will have all of the same headers as the original student file in addition to a new header called "Choice Number", which indicates how preferable the student's assignment was to them. 

For instance, a "Choice Number" of 1 means the student got their first choice, 2 would be their second choice, and so on. A "Choice Number" of 0 would indicate that the student didn't get any of their choices and -1 would indicate that they got an illegal section. Note that the "Choice Number" field uses the student's adjusted preferences (see below).

Additionally, the saved csv file will have updated information in the "Placement" column. Each student will now have this field populated with a Core Section #. 

Finally, you will notice that the fields "Choice 1", "Choice 2",... and so on will have changed for students who listed illegal preferences (SortingHat lists these student IDs early on in the program). The new "Choice 1", "Choice 2", ... fields are the student's adjusted preferences. Choices are adjusted to remove any Core Section #s present in the student's "Illegal Sections" field and to remove duplicate Core Section #s in the students preferences.  
