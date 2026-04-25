const baseUrl = process.env.DEPLOYMENT_URL?.trim();
const token = process.env.DIAGNOSTICS_TOKEN?.trim();

if (!baseUrl) {
  console.error("Missing DEPLOYMENT_URL. Example: DEPLOYMENT_URL=https://your-domain.com");
  process.exit(1);
}

if (!token) {
  console.error("Missing DIAGNOSTICS_TOKEN. Set the same token configured on the server.");
  process.exit(1);
}

const diagnosticsUrl = new URL("/api/diagnostics", baseUrl);
diagnosticsUrl.searchParams.set("token", token);

try {
  const response = await fetch(diagnosticsUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "ViaQuranDeploymentCheck/1.0",
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    console.error(`Diagnostics failed with HTTP ${response.status}.`);
    if (payload) {
      console.error(JSON.stringify(payload, null, 2));
    }
    process.exit(1);
  }

  console.log(JSON.stringify(payload, null, 2));
} catch (error) {
  console.error("Failed to reach the deployment diagnostics endpoint.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
