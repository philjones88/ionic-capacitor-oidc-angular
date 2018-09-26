export interface Config {
    /*
    * This is your OpenID Connect Server's URL
    */
    oidcServerUrl: string;

    /*
    * This is your apps client id that is registered with the OpenId Connect server
    */
    clientId: string;

    /*
    * This is where the OpenID Connect Server will redirect back to
    * E.g. myapp://redirect
    * "myapp" needs to be listed in your iOS Info.plist file like:
    *
    * <key>CFBundleURLTypes</key>
    *<array>
    *   <dict>
    *       <key>CFBundleURLSchemes</key>
    *       <array>
    *           <string>myapp</string>
    *       </array>
    *       <key>CFBundleURLName</key>
    *       <string>myapp</string>
    *   </dict>
    *   ...
    *</array>
    */
    redirectUri: string;

    /*
    * The scopes you are requesting
    * This code assumes you are asking for for:
    * [
    *   'openid', // so we use OpenID connect
    *   'profile', // so we can access the user's profile
    *   'offline_access' // so we can get a refresh token
    * ]
    */
    scopes: string[];
}
