import React, { useEffect } from "react"
import { useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import { AddProjectArgs, Project, Section, Task, TodoistApi, TodoistEntity } from '@doist/todoist-api-typescript'
import { getOAuthToken, getAccessToken } from './background'
import { appendFile } from "fs"
import { useQuery } from "react-query"
type BLACKBOARD_GET_TASKS_RESPONSE = {
  results: BLACKBOARD_RAW_TASK[]
}

type BLACKBOARD_RAW_TASK = {
  id: string,
  title: string,
  calendarName: string
}


function IndexPopup() {
  const [OAuthToken, setOAuthToken] = useStorage<string>("OAuthToken", "")
  const [AccessToken, setAccessToken] = useStorage<string>("AccessToken", "")

  // TODO: USE EFFECT ON GETTING TASKS
  const [Tasks, setTasks] = useState<BLACKBOARD_RAW_TASK[]>([])
  const [Error, setError] = useState<string>("")
  var TODOIST_API = new TodoistApi(AccessToken)
  var TODOIST_CLIENT_ID = process.env["TODOIST_CLIENT_ID"]
  var TODOIST_CLIENT_SECRET = process.env["TODOIST_CLIENT_SECRET"]


  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#F3F3EB"
      }}>
      <h1> Blackboard </h1>
      {Tasks && Tasks.length > 0 && Tasks.map((task: BLACKBOARD_RAW_TASK, index: number) => { return (<div key={index} style={{ "width": "100%", backgroundColor: "#808080", borderRadius: "5px", textAlign: "center", color: "white", "marginBottom": "5px" }}>{task.title}</div>) })}
      <button onClick={() => getTasks().then((result) => { setTasks(result) }).catch((error) => { setError(error.message) })
      }>Get Tasks</button>
      <button onClick={() => { setTasks([]) }
      }>Clear Tasks</button>

      <h1> - </h1>



      <h1>Todoist</h1>
      <a>OAuthToken: {OAuthToken}</a>
      <a>AccessToken: {AccessToken}</a>

      <button onClick={async () => {
        let options: chrome.identity.WebAuthFlowOptions = { 'url': 'https://todoist.com/oauth/authorize/?client_id=' + TODOIST_CLIENT_ID + '&scope=data%3Aread_write&state=guess', 'interactive': true }

        chrome.identity.launchWebAuthFlow(options, function (response: string) {
          // DEFINE URL OBJECT
          const responseURLObject = new URL(response);

          // GET TOKEN
          setOAuthToken(responseURLObject.searchParams.get('code'))

          // OUTPUT TOKEN
          console.log("[background][getOAuthToken] Retrieved Token: " + OAuthToken)
        })
      }
      }>
        Get OAuthToken
      </button >


      <button onClick={async () => {
        setAccessToken(await getAccessToken(OAuthToken))
      }}
      >
        Get Access Token
      </button>

      <button onClick={() => updateTasks(Tasks, TODOIST_API)}>
        updateTasks
      </button>




      <h1>{Error}</h1>

    </div >
  )
}

async function getTasks() {

  const response = await fetch("https://elearning.utdallas.edu/learn/api/public/v1/calendars/items?since=2022-08-22")

  if (response.status == 401) {
    throw new Error("[Error] User must login to BlackBoard")
  }

  const responseJSON: BLACKBOARD_GET_TASKS_RESPONSE = await (response).json()

  return responseJSON.results
}

// TODO: CREATE PROJECT & SECTIONS
async function updateTasks(tasks: BLACKBOARD_RAW_TASK[], TODOIST_API: TodoistApi) {
  // function to clean the classname
  const getCleanClassName = (rawClassName: string) => {
    var className = ""
    let colonIndex = rawClassName.indexOf(":")
    let lastDashIndex = rawClassName.lastIndexOf("-")
    className = rawClassName.substring(colonIndex + 2, lastDashIndex)
    return className.trim()
  }

  // DEFINE SEMESTER
  const semester = "Fall 2022"
  const project = await validateProject(semester, TODOIST_API)


  for (let i = 0; i < tasks.length; i++) {
    let task: BLACKBOARD_RAW_TASK = tasks[i]
    const section: Section = await validateSection(getCleanClassName(task.calendarName), project, TODOIST_API)
    // CREATE TASK
    const addedTask = await TODOIST_API.addTask({ content: task.title, projectId: project.id, sectionId: section.id })

    // CREATE TASK
    console.log("Added Task " + addedTask.content + " under " + project.name + " | " + section.name)
  }

}
// FUNCTION WILL CREATE A PROJECT FOR USER UNLESS ALREADY THERE
async function validateProject(givenProject: string, TODOIST_API: TodoistApi) {
  const currentProjects: Project[] = await TODOIST_API.getProjects()
  // CHECK IF PROJECT EXISTS
  let projectExists: boolean = false
  let existentProject: Project
  currentProjects.forEach((project: Project) => {
    if (project.name == givenProject) {
      projectExists = true
      existentProject = project
    }
  })

  if (!projectExists) {
    const addedProject: Project = await TODOIST_API.addProject({ name: givenProject })
    return addedProject
  } else {
    return existentProject
  }
}

async function validateSection(givenSection: string, project: Project, TODOIST_API: TodoistApi) {
  // GET PROJECT
  const projectID = project.id

  // GET ALL SECTIONS
  const sections = await TODOIST_API.getSections(projectID)

  // BOOLEAN SECTION FOUND
  let sectionFound: boolean = false
  let sectionToReturn: Section

  // CHECK IF SECTION EXISTS
  sections.forEach((section) => {
    if (givenSection == section.name) {
      sectionFound = true
      sectionToReturn = section
    }
  })

  if (!sectionFound) {
    // SEND TO CONSOLE
    console.log("'Creating' Section " + givenSection + " under " + project.name)

    // CREATE SECTION
    sectionToReturn = await TODOIST_API.addSection({ name: givenSection, projectId: projectID })
  }

  return sectionToReturn

}

export default IndexPopup
