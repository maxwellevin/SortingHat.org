import pandas as pd
import random

# Settings
num_sections = 35
seats_per_section = 20
num_students = 693
section_filename = "py_sections_1.csv"
student_filename = "py_students_1.csv"

# Create Section Data
core_section_numbers = ["Section-" + str(i+1) for i in range(num_sections)]
professors = [chr(ord("A") + i)*3 for i in range(num_sections)]
student_caps = [seats_per_section for _ in range(num_sections)]

# Create DataFrame
sections = pd.DataFrame(data=[{  
    "Core Section #": core_section_numbers[i],
    "Professor": professors[i],
    "Student Cap": student_caps[i]
} for i in range(num_sections)])


# Create Students Data
core_section_numbers = set(core_section_numbers)
choice1 = [random.choice(tuple(core_section_numbers)) for i in range(num_students)]
choice2 = [random.choice(tuple(core_section_numbers - {choice1[i]})) for i in range(num_students)]
choice3 = [random.choice(tuple(core_section_numbers - {choice1[i], choice2[i]})) for i in range(num_students)]
choice4 = [random.choice(tuple(core_section_numbers - {choice1[i], choice2[i], choice3[i]})) for i in range(num_students)]
choice5 = [random.choice(tuple(core_section_numbers - {choice1[i], choice2[i], choice3[i], choice4[i]})) for i in range(num_students)]
choice6 = [random.choice(tuple(core_section_numbers - {choice1[i], choice2[i], choice3[i], choice4[i], choice5[i]})) for i in range(num_students)]

# Create DataFrame
students = pd.DataFrame(data=[{
    "Placement": random.choice((choice1[i], choice2[i], choice3[i])) if random.random() > 0.90 else "",
    "ID": str(i),
    "Gender": "F" if random.random() > 0.40 else "M",
    "Athlete": "Y" if random.random() > 0.75 else "",
    "Sport": "", 
    "Previous Instructor": "", 
    "Illegal Sections": "", 
    "Choice 1": choice1[i],
    "Choice 2": choice2[i],
    "Choice 3": choice3[i],
    "Choice 4": choice4[i],
    "Choice 5": choice5[i],
    "Choice 6": choice6[i],
} for i in range(num_students)])

# Save csv files
sections.to_csv(section_filename, index=False)
students.to_csv(student_filename, index=False)
