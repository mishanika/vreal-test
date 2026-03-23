function isAllowedMimeType(mimeType: string): boolean {
  return ["image/jpeg", "image/png", "image/webp"].includes(mimeType);
}

function generateCloneName(name: string): string {
  return `${name} (copy)`;
}

type PermissionLevel = "read" | "write" | "admin";
const LEVEL_RANK: Record<PermissionLevel, number> = { read: 1, write: 2, admin: 3 };

function hasPermission(userLevel: PermissionLevel, required: PermissionLevel): boolean {
  return LEVEL_RANK[userLevel] >= LEVEL_RANK[required];
}

function buildPublicUrl(token: string, baseUrl = "http://localhost:5173"): string {
  return `${baseUrl}/shared/${token}`;
}

function validateNodeName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Name cannot be empty" };
  }
  if (name.trim().length > 255) {
    return { valid: false, error: "Name too long (max 255 characters)" };
  }
  return { valid: true };
}

function getNextOrder(nodes: Array<{ order: number }>): number {
  if (nodes.length === 0) return 0;
  return Math.max(...nodes.map((n) => n.order)) + 1;
}

describe("isAllowedMimeType()", () => {
  it("should accept image/jpeg", () => {
    expect(isAllowedMimeType("image/jpeg")).toBe(true);
  });

  it("should accept image/png", () => {
    expect(isAllowedMimeType("image/png")).toBe(true);
  });

  it("should accept image/webp", () => {
    expect(isAllowedMimeType("image/webp")).toBe(true);
  });

  it("should reject image/gif", () => {
    expect(isAllowedMimeType("image/gif")).toBe(false);
  });

  it("should reject application/pdf", () => {
    expect(isAllowedMimeType("application/pdf")).toBe(false);
  });

  it("should reject video/mp4", () => {
    expect(isAllowedMimeType("video/mp4")).toBe(false);
  });

  it("should reject empty string", () => {
    expect(isAllowedMimeType("")).toBe(false);
  });
});

describe("generateCloneName()", () => {
  it("should append (copy) to the name", () => {
    expect(generateCloneName("MyPhoto")).toBe("MyPhoto (copy)");
  });

  it("should handle names with spaces", () => {
    expect(generateCloneName("My Documents")).toBe("My Documents (copy)");
  });

  it("should handle empty string (edge case)", () => {
    expect(generateCloneName("")).toBe(" (copy)");
  });
});

describe("hasPermission()", () => {
  it("read level should satisfy read requirement", () => {
    expect(hasPermission("read", "read")).toBe(true);
  });

  it("write level should satisfy read requirement", () => {
    expect(hasPermission("write", "read")).toBe(true);
  });

  it("admin level should satisfy write requirement", () => {
    expect(hasPermission("admin", "write")).toBe(true);
  });

  it("read level should NOT satisfy write requirement", () => {
    expect(hasPermission("read", "write")).toBe(false);
  });

  it("write level should NOT satisfy admin requirement", () => {
    expect(hasPermission("write", "admin")).toBe(false);
  });

  it("admin level should satisfy admin requirement", () => {
    expect(hasPermission("admin", "admin")).toBe(true);
  });
});

describe("buildPublicUrl()", () => {
  it("should build a correct public URL with a token", () => {
    const token = "abc-123";
    expect(buildPublicUrl(token)).toBe("http://localhost:5173/shared/abc-123");
  });

  it("should accept a custom base URL", () => {
    expect(buildPublicUrl("tok", "https://example.com")).toBe("https://example.com/shared/tok");
  });
});

describe("validateNodeName()", () => {
  it("should validate a normal name", () => {
    const result = validateNodeName("My Folder");
    expect(result.valid).toBe(true);
  });

  it("should reject empty string", () => {
    const result = validateNodeName("");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("empty");
  });

  it("should reject whitespace-only string", () => {
    const result = validateNodeName("   ");
    expect(result.valid).toBe(false);
  });

  it("should reject names longer than 255 characters", () => {
    const longName = "a".repeat(256);
    const result = validateNodeName(longName);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("long");
  });

  it("should accept a 255-character name", () => {
    const name = "a".repeat(255);
    const result = validateNodeName(name);
    expect(result.valid).toBe(true);
  });
});

describe("getNextOrder()", () => {
  it("should return 0 for an empty array", () => {
    expect(getNextOrder([])).toBe(0);
  });

  it("should return max + 1", () => {
    const nodes = [{ order: 0 }, { order: 1 }, { order: 2 }];
    expect(getNextOrder(nodes)).toBe(3);
  });

  it("should handle non-sequential orders", () => {
    const nodes = [{ order: 0 }, { order: 5 }, { order: 2 }];
    expect(getNextOrder(nodes)).toBe(6);
  });
});

describe("Jest mock example: file repository", () => {
  let findOneStub: jest.Mock;

  beforeEach(() => {
    findOneStub = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return a file node when found", async () => {
    const fakeNode = { id: "1", name: "photo.jpg", type: "file" };
    findOneStub.mockResolvedValue(fakeNode);

    const result = await findOneStub({ where: { id: "1" } });
    expect(result).toEqual(fakeNode);
    expect(findOneStub).toHaveBeenCalledTimes(1);
  });

  it("should return null when not found", async () => {
    findOneStub.mockResolvedValue(null);

    const result = await findOneStub({ where: { id: "nonexistent" } });
    expect(result).toBeNull();
  });
});

describe("Permission level edge cases", () => {
  it("owner always has admin-level access", () => {
    function isOwnerOrHasPermission(
      ownerId: string,
      userId: string,
      perm?: PermissionLevel,
      required: PermissionLevel = "read",
    ): boolean {
      if (ownerId === userId) return true;
      if (!perm) return false;
      return hasPermission(perm, required);
    }

    expect(isOwnerOrHasPermission("user1", "user1")).toBe(true);
    expect(isOwnerOrHasPermission("user1", "user2", "read", "write")).toBe(false);
    expect(isOwnerOrHasPermission("user1", "user2", "write", "write")).toBe(true);
  });
});
