declare module 'openssl-self-signed-certificate' {
  export interface SelfSignedCertificate {
    cert: string;
    key: string;
  }

  const certificate: SelfSignedCertificate;
  export default certificate;
}