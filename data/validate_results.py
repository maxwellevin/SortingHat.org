import pandas as pd


section_df = pd.read_csv('section4_headers.csv', index_col="Core Section #")
student_df = pd.read_csv('student4_headers.csv', index_col="ID")
results_df = pd.read_csv('sortedhat-4.csv', index_col="Student ID")

sectionIDs = list(section_df.index)

def getAdjustedPreferences(student):
    all_prefs_legal = True
    illegal_prefs = set(getIllegalPreferences(student))
    prefs = []
    for i in range(1, 7):
        pref = student[f"Choice {i}"]
        print(pref)
        if (pref not in sectionIDs) or (pref in illegal_prefs) or (pref in prefs): 
            all_prefs_legal = False
        else:
            prefs.append(pref)
    all_prefs_legal = all_prefs_legal and len(prefs) == 6
    return all_prefs_legal, prefs


def getIllegalPreferences(student):
    ill = str(student["Illegal Sections"])
    if ill:
        return ill.replace(" ", "").split(",")
    return []


def getStudentByID(student_id):
    return student_df[student_id]


def getPreferenceNumber(sectionID, preferences):
    i = 1
    for pref in preferences:
        if sectionID == pref:
            return i
        i += 1
    if i <= 6: 
        return i
    return 0

for row in results_df.iterrows():
    id = row[0]
    sectionID = str(row[1][0])
    student = student_df.loc[id]
    prefs = getAdjustedPreferences(student)
    # print(type(sectionID))
    # print(getPreferenceNumber(sectionID, prefs))
    pass
