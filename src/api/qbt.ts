import { QbtSearchApi } from "./qbt-search";

export { QbtAuthExpiredError } from "./qbt-core";

export class QbtClient extends QbtSearchApi {}

export const qbtClient: QbtClient = new QbtClient();
