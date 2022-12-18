import React from "react"
import { useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import { getOAuthToken, getAccessToken } from './background'
function IndexPopup() {
  const [OAuthToken, setOAuthToken] = useStorage<string>("OAuthToken")
  const [AccessToken, setAccessToken] = useStorage<string>("AccessToken")

  var TODOIST_CLIENT_ID = process.env["TODOIST_CLIENT_ID"]
  var TODOIST_CLIENT_SECRET = process.env["TODOIST_CLIENT_SECRET"]

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16
      }}>
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
        const AccessToken = await getAccessToken(OAuthToken)
      }}>
        Get Access Token
      </button>


      <a>{OAuthToken}</a>
      <a>{AccessToken}</a>
    </div >
  )
}

export default IndexPopup
