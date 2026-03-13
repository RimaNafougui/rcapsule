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
  email: string;
}

export function NewsletterWelcome({ email }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Rcapsule — your wardrobe, organised.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>You&apos;re on the list.</Heading>

          <Text style={paragraph}>
            Welcome to Rcapsule. We&apos;ll keep you in the loop on new
            features, style drops, and wardrobe tips — no noise, just the good
            stuff.
          </Text>

          <Hr style={divider} />

          <Text style={paragraph}>
            In the meantime, start building your digital closet at{" "}
            <Link href="https://rcapsule.com" style={link}>
              rcapsule.com
            </Link>
            .
          </Text>

          <Hr style={divider} />

          <Text style={footer}>
            You&apos;re receiving this because {email} subscribed at
            rcapsule.com.{" "}
            <Link
              href={`https://rcapsule.com/unsubscribe?email=${encodeURIComponent(email)}`}
              style={footerLink}
            >
              Unsubscribe
            </Link>
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

const divider = {
  borderColor: "#222222",
  margin: "28px 0",
};

const link = {
  color: "#ffffff",
  textDecoration: "underline",
};

const footer = {
  color: "#555555",
  fontSize: "12px",
  lineHeight: "1.6",
};

const footerLink = {
  color: "#555555",
  textDecoration: "underline",
};
