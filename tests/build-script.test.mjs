import assert from "node:assert/strict";
import { chmod, cp, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("build wrapper can enter the Sites environment when helper scripts lose executable mode", async () => {
  const root = await mkdtemp(join(tmpdir(), "lucid-build-"));
  const scripts = join(root, "scripts");
  const bin = join(root, "node_modules", ".bin");
  await mkdir(scripts, { recursive: true });
  await mkdir(bin, { recursive: true });
  await cp(new URL("../scripts/build-verified.sh", import.meta.url), join(scripts, "build-verified.sh"));
  await writeFile(join(scripts, "sites-env.sh"), "#!/usr/bin/env bash\nshift\nSITES_ENV_READY=1 SITES_PROJECT_ROOT=\"$TEST_PROJECT_ROOT\" exec \"$@\"\n");
  await writeFile(join(scripts, "validate-artifact.sh"), "#!/usr/bin/env bash\nexit 0\n");
  await writeFile(join(bin, "vinext"), "#!/usr/bin/env bash\nexit 0\n");
  await chmod(join(scripts, "build-verified.sh"), 0o644);
  await chmod(join(scripts, "sites-env.sh"), 0o644);
  await chmod(join(scripts, "validate-artifact.sh"), 0o755);
  await chmod(join(bin, "vinext"), 0o755);

  const result = spawnSync("bash", [join(scripts, "build-verified.sh")], {
    encoding: "utf8",
    env: { ...process.env, TEST_PROJECT_ROOT: root },
  });

  assert.equal(result.status, 0, result.stderr);
});
