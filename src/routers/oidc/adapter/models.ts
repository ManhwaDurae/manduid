import { OidcAccessToken } from "../../../models/oidc/OidcAccessToken";
import { OidcAuthorizationCode } from "../../../models/oidc/OidcAuthorizationCode";
import { OidcClient } from "../../../models/oidc/OidcClient"
import { OidcClientCredentials } from "../../../models/oidc/OidcClientCredentials";
import { OidcDeviceCode } from "../../../models/oidc/OidcDeviceCode"
import { OidcInitialAccessToken } from "../../../models/oidc/OidcInitialAccessToken";
import { OidcInteraction } from "../../../models/oidc/OidcInteraction";
import { OidcPushedAuthorizationRequest } from "../../../models/oidc/OidcPushedAuthorizationRequest";
import { OidcRefreshToken } from "../../../models/oidc/OidcRefreshToken";
import { OidcRegistrationAccessToken } from "../../../models/oidc/OidcRegistrationAccessToken";
import { OidcReplayDetection } from "../../../models/oidc/OidcReplayDetection";
import { OidcSession } from "../../../models/oidc/OidcSession";
import { Model } from "sequelize-typescript";
import { BuildOptions } from "sequelize/types";

interface modelsInterface {
    [index: string] : typeof Model & {
        new(values?: object, options?: BuildOptions): Model;
      } & (new () => Model);
}

let models : modelsInterface = {OidcAccessToken, OidcAuthorizationCode, OidcClient, OidcClientCredentials, OidcDeviceCode, OidcInitialAccessToken, OidcInteraction, OidcPushedAuthorizationRequest, OidcRefreshToken, OidcRegistrationAccessToken, OidcReplayDetection, OidcSession};

export default models;