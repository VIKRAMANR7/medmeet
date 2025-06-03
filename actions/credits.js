"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";

//Define credit allocations per plan
const PLAN_CREDITS = {
  free_user: 0, //Basic plan: 2 credits
  standard: 10, //Standard plan: 10 credits per month
  premium: 24, // Premium plan: 24 credits per month
};

//Each appointment costs 2 credits
const APPOINTMENT_CREDITS_COST = 2;

export async function checkAndAllocateCredits(user) {
  try {
    if (!user) {
      return null;
    }
    //Only allocate credits for patient
    if (user.role !== "PATIENT") {
      return user;
    }
    const { has } = await auth();
    const hasBasic = has({ plan: "free_user" });
    const hasStandard = has({ plan: "standard" });
    const hasPremium = has({ plan: "premium" });

    let currentPlan = null;
    let creditsToAllocate = 0;

    if (hasPremium) {
      currentPlan = "premium";
      creditsToAllocate = PLAN_CREDITS.premium;
    } else if (hasStandard) {
      currentPlan = "standard";
      creditsToAllocate = PLAN_CREDITS.standard;
    } else if (hasBasic) {
      currentPlan = "free_user";
      creditsToAllocate = PLAN_CREDITS.free_user;
    }
    // If user doesn't have any plan, just return the user
    if (!currentPlan) {
      return user;
    }
    // Check if we already allocated credits for this month
    const currentMonth = format(new Date(), "yyyy-MM");

    // If there's a transaction this month, check if it's for the same plan
    if (user.transactions.length > 0) {
      console.log(user.transactions);
      const latestTransaction = user.transactions[0];
      const transactionMonth = format(
        new Date(latestTransaction.createdAt),
        "yyyy-MM"
      );
      const transactionPlan = latestTransaction.packageId;

      if (transactionMonth === currentMonth) {
        console.log("Credits already allocated this month");
        return user;
      }

      //If we already allocated credits for this month and the plan is the same, just return
      if (
        transactionMonth === currentMonth &&
        transactionPlan === currentPlan
      ) {
        return user;
      }
    }

    const updatedUser = await db.$transaction(async (tx) => {
      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          amount: creditsToAllocate,
          type: "CREDIT_PURCHASE",
          packageId: currentPlan,
        },
      });
      //Update user's credit balance
      const updatedUser = await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          credits: {
            increment: creditsToAllocate,
          },
        },
      });

      return updatedUser;
    });

    revalidatePath("/doctors");
    revalidatePath("/appointments");

    return updatedUser;
  } catch (error) {
    console.error(
      "Failed to check subscription and allocate credits:",
      error.message
    );
  }
}
