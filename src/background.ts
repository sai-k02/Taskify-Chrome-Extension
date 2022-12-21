import { useContext } from "react"
import { URLSearchParams } from "url"
export { }

// DEFINE CONSTANTS
var TODOIST_CLIENT_ID = process.env["TODOIST_CLIENT_ID"]
var TODOIST_CLIENT_SECRET = process.env["TODOIST_CLIENT_SECRET"]

// TODO: CHECK IF STATE IS THE SAME 
// TODO: SEP STATE
export const getOAuthToken = async (): Promise<string> => {
    let token = ""

    // DEFINE OPTIONS
    let options: chrome.identity.WebAuthFlowOptions = { 'url': 'https://todoist.com/oauth/authorize/?client_id=' + TODOIST_CLIENT_ID + '&scope=data%3Aread_write&state=guess', 'interactive': true }

    chrome.identity.launchWebAuthFlow(options, function (response: string) {
        // DEFINE URL OBJECT
        const responseURLObject = new URL(response);

        // GET TOKEN
        token = responseURLObject.searchParams.get('code')

        // OUTPUT TOKEN
        console.log("[background][getOAuthToken] Retrieved Token: " + token)
    })

    if (token != "") {

        return token
    }

}


export const getAccessToken = async (OAuthToken: string): Promise<string> => {

    console.log("Getting access token with :" + OAuthToken)

    const url = new URL("https://todoist.com/oauth/access_token/")
    url.searchParams.append("client_id", "ebe92c2f20604591926e4507675783d4")
    url.searchParams.append("client_secret", "186e81e90ae54018a73c83ceea522021")
    url.searchParams.append("code", OAuthToken)

    const response = await fetch(url, {
        method: "POST", headers: { 'Content-Type': 'application/json' },
    })

    let responseJSON = await response.json()
    let token = responseJSON["access_token"]

    // RETRIEVE API_KEY FROM RESPONSE
    return token
}



export default getOAuthToken