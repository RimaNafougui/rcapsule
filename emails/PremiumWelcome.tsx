import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

interface Props {
  name?: string;
  email: string;
}

export function PremiumWelcome({ name, email }: Props) {
  const displayName = name || "there";

  return (
    <Html>
      <Head />
      <Preview>Welcome to Rcapsule Premium — your stylist is ready.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={label}>Rcapsule Premium</Text>
          <Heading style={h1}>You&apos;re in, {displayName}.</Heading>

          <Text style={paragraph}>
            Your premium membership is now active. Here&apos;s what you just
            unlocked:
          </Text>

          <ul style={list}>
            <li style={listItem}>
              <strong style={strong}>AI Outfit Generator</strong> — daily looks
              curated for your weather &amp; events
            </li>
            <li style={listItem}>
              <strong style={strong}>Magic Background Removal</strong> —
              one-click clean product shots
            </li>
            <li style={listItem}>
              <strong style={strong}>Weather Intelligence</strong> — never be
              overdressed or underdressed again
            </li>
            <li style={listItem}>
              <strong style={strong}>Cost-Per-Wear Analytics</strong> — know the
              real value of every piece
            </li>
          </ul>

          <Hr style={divider} />

          <Text style={paragraph}>
            Head to your closet to start using your new features.
          </Text>

          <Link href="https://rcapsule.com/closet" style={button}>
            Open My Closet →
          </Link>

          <Hr style={divider} />

          <Text style={footer}>
            Questions? Reply to this email or reach us at{" "}
            <Link href="mailto:hello@rcapsule.com" style={footerLink}>
              hello@rcapsule.com
            </Link>
            <br />
            This email was sent to {email}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#000000",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "48px 24px",
  maxWidth: "560px",
};

const label = {
  color: "#555555",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "3px",
  textTransform: "uppercase" as const,
  margin: "0 0 16px",
};

const h1 = {
  color: "#ffffff",
  fontSize: "32px",
  fontWeight: "900",
  letterSpacing: "-1px",
  textTransform: "uppercase" as const,
  fontStyle: "italic",
  margin: "0 0 24px",
};

const paragraph = {
  color: "#999999",
  fontSize: "15px",
  lineHeight: "1.7",
  margin: "0 0 20px",
};

const list = {
  color: "#999999",
  fontSize: "15px",
  lineHeight: "1.7",
  paddingLeft: "20px",
  margin: "0 0 24px",
};

const listItem = {
  marginBottom: "10px",
};

const strong = {
  color: "#ffffff",
};

const divider = {
  borderColor: "#222222",
  margin: "28px 0",
};

const button = {
  display: "inline-block",
  backgroundColor: "#ffffff",
  color: "#000000",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "2px",
  textTransform: "uppercase" as const,
  textDecoration: "none",
  padding: "14px 28px",
  margin: "8px 0 0",
};

const footer = {
  color: "#555555",
  fontSize: "12px",
  lineHeight: "1.7",
};

const footerLink = {
  color: "#555555",
  textDecoration: "underline",
};
