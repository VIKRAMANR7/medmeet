"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export default async function setUserRole(formData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  //Find user in our database
  const user = await db.user.findUnique({ where: { clerkUserId: userId } });

  if (!user) {
    throw new Error("User not found");
  }

  const role = formData.get("role");
  if (!role || !["PATIENT", "DOCTOR"].includes(role)) {
    throw new Error("Invalid role selection");
  }

  try {
    if (role === "PATIENT") {
      await db.user.update({
        where: { clerkUserId: userId },
        data: { role: "PATIENT" },
      });
      revalidatePath("/");
      return { success: true, redirect: "/doctors" };
    }

    if (role === "DOCTOR") {
      const specialty = formData.get("specialty");
      const experience = parseInt(formData.get("experience"), 10);
      const credentialUrl = formData.get("credentialUrl");
      const description = formData.get("description");
      if (!specialty || !experience || !credentialUrl || !description) {
        throw new Error("Missing required fields");
      }
      await db.user.update({
        where: { clerkUserId: userId },
        data: {
          role: "DOCTOR",
          specialty,
          experience,
          credentialUrl,
          description,
          verificationStatus: "PENDING",
        },
      });
      revalidatePath("/");
      return { success: true, redirect: "/doctor/verification" };
    }
  } catch (error) {
    console.error("Failed to set user role:", error);
    throw new Error("Failed to update user profile:" ,${error.message});
  }
  return <div>onboarding</div>;
}

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }
  try {
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    return user;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return null;
  }
}