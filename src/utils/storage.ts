export const getOAuthTokenStorage = async (): Promise<string> => {
    var OAuthToken = ""
    console.log(await chrome.storage.local.get("OAuthToken"))
    return OAuthToken
}

export const setOAuthTokenStorage = async (NewOAuthToken: string): Promise<boolean> => {
    await chrome.storage.local.set({
        'OAuthToken': NewOAuthToken
    })
    return true
}