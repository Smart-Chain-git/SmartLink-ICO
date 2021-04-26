# Revolut OAuth authentication and token generation

For those non familiar with the Oauth process, this doc is here to clarify certain points of the Revolut official documentation (https://developer.revolut.com/docs/manage-accounts/). We will follow the steps of the official doc.

This doc is for production (https://business.revolut.com/) and sandbox (https://sandbox-business.revolut.com/).


### 1) Upload your certificate
For the OAuth redirect URI you can set whatever URL you want. The authorization code will be in the URL.
You can set https://google.com for example, the result will be https://google.com/?code=oa_sand_l706jxdZfg2Go1BYJ25Ao5OxqKIOQjwQKMUr_ZplR3I&state=
Or http://myfakeurl.com and the result will be http://myfakeurl.com/?code=oa_sand_l706jxdZfg2Go1BYJ25Ao5OxqKIOQjwQKMUr_ZplR3I&state=

### 2) Consent the application
Nothing special...

### 3) Generate a client assertion
Use https://jwt.io/#debugger-io
Choose algorithm RS256.
Modify the payload with the appropriate one given in the official doc.
Set a short expiration time (< 24h) in UNIX timestamp (you can use https://www.epochconverter.com/).
Put your privatekey to sign the token and your publickey to verify the signature.

### 4) Exchange authorization code for access token
Get the refresh token from the result of the command you ran.
We will use the refresh token in the env file of the application.
**Note :** The token expires after a few hours, if you don't use the application, you will have to generate a new JWT

**Step 5 and 6 are not necessary.**