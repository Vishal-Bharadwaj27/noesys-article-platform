import * as sgMail from "@sendgrid/mail";

/**
 * Send OTP email using SendGrid
 */
export async function sendOTPEmail(
  email: string,
  otp: string,
  apiKey: string,
  fromEmail: string,
): Promise<boolean> {
  try {
    sgMail.setApiKey(apiKey);

    const msg = {
      personalizations: [
        {
          to: [
            {
              email: email,
            },
          ],
        },
      ],
      from: {
        email: fromEmail,
        name: "Article Platform",
      },
      subject: "Your Article Platform OTP",
      content: [
        {
          type: "text/plain",
          value: `Your OTP is ${otp}`,
        },
      ] as any,
    };

    await sgMail.send(msg);
    console.log(`OTP email sent to ${email}`);
    return true;
  } catch (error: any) {
    console.error(
      "SendGrid error:",
      JSON.stringify(error.response?.body, null, 2),
    );
    return false;
  }
}

/**
 * Send OTP with fallback to console logging in non-production environments.
 * In production, always attempts a real send via SendGrid and throws on failure
 * so the caller can surface an error response instead of silently succeeding.
 */
export async function sendOTPWithFallback(
  email: string,
  otp: string,
  apiKey: string,
  fromEmail: string,
  environment: string = "development",
): Promise<void> {
  if (environment !== "production") {
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    return;
  }

  const sent = await sendOTPEmail(email, otp, apiKey, fromEmail);

  if (!sent) {
    throw new Error("Failed to send OTP email");
  }
}