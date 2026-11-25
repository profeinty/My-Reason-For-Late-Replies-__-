# Security Policy

## Overview

The **My-Reason-For-Late-Replies-__-** team takes the security of this project seriously. We appreciate the efforts of security researchers and community members who help us identify and resolve potential security vulnerabilities.

This policy explains how to report security issues, which versions are supported, and how vulnerabilities should be handled responsibly.

## Supported Versions

Security updates will primarily be provided for the latest version of the project.

| Version | Security Support |
|---|---|
| Latest version on `main` | Supported |
| Older versions | Not guaranteed |
| Unmaintained versions | Not supported |

## Reporting a Vulnerability

If you discover a potential security vulnerability, please report it responsibly so the maintainers can investigate and address the issue.

**Please do not disclose security vulnerabilities through public GitHub Issues, Discussions, or Pull Requests.**

Instead, use GitHub's private vulnerability reporting feature if it is enabled for this repository.

Repository: https://github.com/profeinty/My-Reason-For-Late-Replies-__-

If private reporting is unavailable, contact the repository maintainers through an appropriate private communication channel.

Please include the following information in your report:

- A clear description of the vulnerability.
- The affected version, branch, or commit, if known.
- Steps to reproduce the issue.
- The potential impact of the vulnerability.
- Relevant screenshots, logs, or proof-of-concept code, if available.

Do not include real passwords, access tokens, private keys, or other sensitive personal information in your report.

## Response and Resolution

The maintainers aim to:

1. Acknowledge vulnerability reports within 7 days.
2. Review the report and assess its severity.
3. Investigate the issue and develop a fix when necessary.
4. Communicate relevant updates to the reporter when possible.
5. Publish security fixes or advisories when appropriate.

These are target response times, not guaranteed deadlines. Resolution time may vary depending on the severity and complexity of the issue.

## Responsible Disclosure

To help protect users and the project, security researchers are requested to:

- Allow the maintainers reasonable time to investigate and resolve reported vulnerabilities.
- Avoid publicly disclosing vulnerabilities before a coordinated disclosure has been agreed upon.
- Avoid accessing, modifying, deleting, or exposing other people's data.
- Avoid disrupting services or performing destructive security tests.
- Test only systems and environments they are authorized to access.

The maintainers will handle reports in good faith and appreciate responsible security research.

## Security Best Practices

Contributors should:

- Never commit passwords, API keys, access tokens, or private credentials.
- Store sensitive configuration values in environment variables or appropriate secret-management systems.
- Keep project dependencies and tools updated.
- Review code changes before merging them.
- Use secure authentication and authorization practices wherever applicable.
- Remove exposed credentials and rotate them immediately if they are accidentally published.
- Follow the principle of least privilege when granting repository access.

## What This Project Keeps

- The calculator locks its numbers with the team passcode and keeps them only in the browser of each device. The passcode is never stored in this repository.
- `reader.js` only reads and clicks inside the MonsoonSIM game tab it is started in, and sends its data only to the FF calculator.
- The pages load nothing from other sites: fonts are hosted in `fonts/`, and the calculator and install page set a Content Security Policy and a Referrer Policy.
- Never commit game sign-ins, team passcodes or browser profiles.

## Scope

This policy covers security vulnerabilities that directly affect the My-Reason-For-Late-Replies-__- repository and its maintained code.

Vulnerabilities in third-party dependencies should be reported to the relevant maintainers as well as to this project's maintainers when they affect the security of this project.

## Acknowledgments

We appreciate everyone who reports security issues responsibly and helps make this project safer for its users and contributors.

Thank you for helping improve the security and reliability of My-Reason-For-Late-Replies-__-.

---

**Project:** My-Reason-For-Late-Replies-__-  
**Repository:** https://github.com/profeinty/My-Reason-For-Late-Replies-__-  
**Maintained by:** Profeinty
