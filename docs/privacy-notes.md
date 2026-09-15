# Privacy Notes

The smoke test collects only data tied to a validation question. Emails are used for the purpose
shown beside each consent control. Review contact permission and possible future publication are
separate, unticked choices; no submitted review is public automatically.

Anonymous first-party cookies retain visitor ID, experiment assignment, and first-touch campaign
attribution. There are no advertising cookies. IP addresses are hashed in memory for rate limiting
and are not persisted. Analytics rejects unknown properties and email-shaped values.

People can request access or deletion through `/contact`. An authenticated operator verifies the
request and uses the stable email hash to remove matching rows across datasets. Backups and exports
must receive the same deletion treatment under the operator's retention procedure.
