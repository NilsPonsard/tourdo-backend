import {
    SignJWT,
    jwtVerify,
    importJWK,
    JWTHeaderParameters,
    generateKeyPair,
    KeyLike,
} from "https://deno.land/x/jose@v4.3.8/index.ts";
const defaultKey = `eyJleHBvcnRlZFByaXZhdGUiOnsia3R5IjoiUlNBIiwiYWxnIjoiUFMyNTYiLCJuIjoiNzMxMGN3QkdjTGVNaFU1YkQwNWQ1RVp0cFlrUTBOMnJhTzY3WEJacnVUd0hGMENqREhseml4TnZhUjRwdXBBZTlVT2M3TnpVSC14dFh0c040N1JHWkc1X2l6bmc4M05EakZvTllmOUU0RTlUcFAzUUVaWVpqcXpQcFk4Wk1LcS1jc3BJSHhyWF93dnBNT1V5eUhNTWdZTl8yZnVlRVZKOG95OTJiWFNERUZpaFZfaGVpaDFPVkVqNHgtNE9uWkZzdFBlUlhhT2V4bEJaNXhNVGFZdXg3VE5OT2NyZS00Q2tYaGJHTTNxRVpxWnFERzlNbzMwdzNiVWlCNUNhRVM0Qi1wYWJfMW9TWlNjVF94ek5vMWlGQnphendTcy1iOVhKZzNuUDNPWEdJcV9NazdUSVBUdTY5ak1FbGNqSWtIV29HQ2tvQU5MRFpVQkZQeTROMUtBLXRRIiwiZSI6IkFRQUIiLCJkIjoialJPc0cycVlGQ0lyNXdOSFpQYlhISGZZYzJFUXhOa3Y5anBicUYyVXk2TnUwZVhEcHItTXJ1cWVBS0JDR0tKNWVpV0FOWV9JYlozS3Q4djJuS0lfclQzaWFGT0tEaDlpTlRWX0dMRlZFNFhuVWhRcUU1SUdNQ1BnbGpoN3NFMkVydjQyQ2d5NEhJZ1pzREh6X2x5M2l6dTVmdUZZTmdBUFo5bTN1N2FjMW0wYm5tdUt6X1c0NHhoTlBHWGVibGY1NV9rbFBjeE9HY2stMzVXbkVjWnpKc1dJUmsyMVhYd3VFclVGSjBVV0s0NzhSZmVfVGZSaWFmZmd5US1pbFFhTmZmWFFJWmpOWjlFTnZ5SDgxaUh2M0hqbzdTTHlCTlF0bG1PdElkWGltendicm5QeGxhTnZhVGJrUHVtc3NGdzRYWDFjdE5Db0FRVzlKcWhvUVl4S1FRIiwicCI6Il9kaHFqemtfVVZ4WDFNRWpmanp0UDctcFNtZEZGY0FFR2tsa0NWanNSUkJSeGlhemJsUTd1MmV3UnVVUFg3YnFLUU5fMlZPUVRlSkEtbHgySkUySncyLUFpVmhDbWU2T0hDN01yczlTWEJKaUx3U2RfNnFxX0ljQjQ4TUNQcndKY0JDSDg4M1doSGFIVkpHS3BTdlB1djF6Z1hGbFJRbmpXZDB5VDRiQlRPayIsInEiOiI4WVhZaFZSV21pV0VKbDZLTW5RS2kzY0VLUGhtd2l1Ml9kRVZvWm84QVhpRmZvLTBCQUJycmFYckRjUk45UHBrMFV0dWlfdGF2Q0tNZVFuM0NnRXJyS0ViSnRRU0lleGpwTWNtaXkzeko4S1RHYUY4QmZGMktyOEF5bzBRYXlHX2dCcTVnR2lmLUg1aDJPZTZ4QUxpOURiOGdscHpFa19keVhmOF8wb0kwLTAiLCJkcCI6Imo1QjdTNzliMFI4QnlhRGwtdnBvVDdxTS16aUd1UE5kSHFUTlFBQWJ1RC12al9ySlZpZXJsS1RpN0dXV0dWTHhBZnNwcm5iMVVTY2FDcjZLVHFQUHUwbHZqNzNzQlBVSFNHY3JlZDVsUFE5a21pVHBXdlJpT2VuOUpweGV3NjVEUkM4RlJOendhd0JDTDVFVXNhLWlqNlhTVXE0WVVVQnpaWnFWWHFiZTRpayIsImRxIjoiTnJnY1ZoakZoaWI1eWJlaGw4eXlsdVpnQ3VnOFg4R0hzX21xN1BJRXBsQ243Z1NneEVkVUhnTjVQYVU4QkVTMmtyU0VWektiWEFSM3p2UnpBOUZBRTl4c1NsX0J1LTNTcFlKNU9ROHdCOUlOZ2NFVVdFUmNnVkxFMng4YW1Tc01OX25XRFVHbV9LV2xoWDc2MFczVl9YNTN0eERIQVY4VzRJNU93NGdDZUFFIiwicWkiOiJSNjR6cEZRM2xLZTlqVUlaV05udDhpMXFJS3NnbnFMWlR3SThjQ1RSdUZScWM2TDFGNzJaVlBZWU1KYlZvbm1fbEFoY2dnaU9YbEJmNUhyOWl2QUlhcGJaYTZfX043akdXUElHZDhocUd4aW9wdUNuSXpESUxuanl2WEg5djZXZE9RazNCdDk0N0xZNFdpTkN4dEhnelVYSmNidVVvejNlOUpKakduYzhJX3MiLCJrZXlfb3BzIjpbInNpZ24iXSwiZXh0IjpmYWxzZX0sImV4cG9ydGVkUHVibGljIjp7Imt0eSI6IlJTQSIsImFsZyI6IlBTMjU2IiwibiI6IjczMTBjd0JHY0xlTWhVNWJEMDVkNUVadHBZa1EwTjJyYU82N1hCWnJ1VHdIRjBDakRIbHppeE52YVI0cHVwQWU5VU9jN056VUgteHRYdHNONDdSR1pHNV9pem5nODNORGpGb05ZZjlFNEU5VHBQM1FFWllaanF6UHBZOFpNS3EtY3NwSUh4clhfd3ZwTU9VeXlITU1nWU5fMmZ1ZUVWSjhveTkyYlhTREVGaWhWX2hlaWgxT1ZFajR4LTRPblpGc3RQZVJYYU9leGxCWjV4TVRhWXV4N1ROTk9jcmUtNENrWGhiR00zcUVacVpxREc5TW8zMHczYlVpQjVDYUVTNEItcGFiXzFvU1pTY1RfeHpObzFpRkJ6YXp3U3MtYjlYSmczblAzT1hHSXFfTWs3VElQVHU2OWpNRWxjaklrSFdvR0Nrb0FOTERaVUJGUHk0TjFLQS10USIsImUiOiJBUUFCIiwia2V5X29wcyI6WyJ2ZXJpZnkiXSwiZXh0Ijp0cnVlfX0=`;

const secret = Deno.env.get("JWK") || defaultKey;

if (secret === defaultKey) {
    console.error("JWK is unsecure and should be changed");
}

// import keys

let ecPublickey: KeyLike | Uint8Array;
let ecPrivatekey: KeyLike | Uint8Array;
try {
    const json = JSON.parse(atob(secret));

    ecPublickey = await importJWK(json.exportedPublic);
    ecPrivatekey = await importJWK(json.exportedPrivate);
} catch (e) {
    console.error("Can’t import JWK", e);
    Deno.exit(1);
}

export function SignToken(id: number, token: string, expirationTime: number) {
    return new SignJWT({ id, token })
        .setProtectedHeader({ alg: "ES256" })
        .setIssuedAt()
        .setExpirationTime(expirationTime)
        .sign(ecPrivatekey);
}

export function DecodeJWT(jwt: string) {
    return jwtVerify(jwt, ecPublickey) as Promise<{
        payload: { id: number; token: string };
        protectedHeader: JWTHeaderParameters;
    }>;
}
