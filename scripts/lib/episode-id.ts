const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Validate an episode id without loading the episode registry. Keeping this
 * helper dependency-free lets approval/status tooling and their tests run even
 * when a different episode in the registry is temporarily mid-authoring.
 */
export function assertEpisodeId(id: string): string {
  if (!idPattern.test(id)) {
    throw new Error(`Invalid episode id "${id}". Use lowercase kebab-case, for example: my-topic`);
  }
  return id;
}