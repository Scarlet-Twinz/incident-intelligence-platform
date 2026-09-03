export type VantaUser = {
  fullName: string;
  email: string;
};

const USER_KEY = "vanta_user";
const SESSION_KEY = "vanta_session";

export function getStoredUser(): VantaUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(USER_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as VantaUser;
  } catch {
    return null;
  }
}

export function createAccount(
  fullName: string,
  email: string,
  password: string
): { success: boolean; error?: string } {
  if (typeof window === "undefined") {
    return {
      success: false,
      error: "Authentication is only available in the browser.",
    };
  }

  const normalizedName = fullName.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedName) {
    return {
      success: false,
      error: "Full name is required.",
    };
  }

  if (!normalizedEmail) {
    return {
      success: false,
      error: "Email is required.",
    };
  }

  if (!normalizedEmail.includes("@")) {
    return {
      success: false,
      error: "Enter a valid email address.",
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      error: "Password must be at least 6 characters.",
    };
  }

  const existingUser = getStoredUser();

  if (existingUser && existingUser.email === normalizedEmail) {
    return {
      success: false,
      error: "An account with this email already exists.",
    };
  }

  const user: VantaUser = {
    fullName: normalizedName,
    email: normalizedEmail,
  };

  window.localStorage.setItem(USER_KEY, JSON.stringify(user));

  /*
   * This prototype stores the password locally only to make the
   * authentication flow functional before the production auth backend
   * is added. Do not use this approach for a production application.
   */
  window.localStorage.setItem(
    `${USER_KEY}_password`,
    password
  );

  return {
    success: true,
  };
}

export function login(
  email: string,
  password: string
): { success: boolean; error?: string } {
  if (typeof window === "undefined") {
    return {
      success: false,
      error: "Authentication is only available in the browser.",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = getStoredUser();

  if (!user) {
    return {
      success: false,
      error: "No VANTA account exists yet. Please create an account first.",
    };
  }

  const storedPassword = window.localStorage.getItem(
    `${USER_KEY}_password`
  );

  if (
    user.email !== normalizedEmail ||
    storedPassword !== password
  ) {
    return {
      success: false,
      error: "Incorrect email or password.",
    };
  }

  window.localStorage.setItem(SESSION_KEY, "authenticated");

  return {
    success: true,
  };
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.localStorage.getItem(SESSION_KEY) ===
    "authenticated"
  );
}

export function logout(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): VantaUser | null {
  if (!isAuthenticated()) {
    return null;
  }

  return getStoredUser();
}