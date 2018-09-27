# Work In progress

# Ionic Capacitor OpenID Connect Angular

This project is aimed at providing the blocks to implement OpenId connect inside your Angular Ionic App using Capacitor over the existing Cordova approaches.

The aim is to be able to perform the full OpenID Connect Code Authorization flow, with PKCE and refresh tokens support too.

## TODO

- [ ] lib
- [ ] ionic sample
- [ ] identity server sample

## Structure

This is the intended project structure

### lib

This is the NPM library of Ionic Capacitor OpenID Connect Angular.

This is where the logic exists to perform the code authorization flow.

### sample

This is a sample Ionic app using the lib demonstrating the flow

### idsrv

This is a sample Identity Server project that you can run locally to develop against.

It has 2 users, `bob` or `alice` with the password `password`

The identity server sample was borrowed from:

https://github.com/IdentityServer/IdentityServer4.Samples/tree/release/Quickstarts/7_JavaScriptClient/src/QuickstartIdentityServer

The only real alterations were to the Config.cs to add an ionic client and to add CORS support.

To run the sample, you will need .net core installed.

Then simply:

`dotnet restore`

and

`dotnet run`

This will start an identity server running locally on localhost:5000