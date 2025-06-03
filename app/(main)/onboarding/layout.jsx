import { getCurrentUser } from "@/actions/onboarding";
import { redirect } from "next/dist/server/api-utils";

export default async function OnBoardingLayout({ children }) {
  const user = await getCurrentUser();

  if (user) {
    if (user.role === "PATIENT") {
      redirect("/doctors");
    }
  }
  return <div>{children}</div>;
}
