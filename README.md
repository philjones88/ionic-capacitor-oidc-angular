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

It has 1 user, `admin` with the password `password`