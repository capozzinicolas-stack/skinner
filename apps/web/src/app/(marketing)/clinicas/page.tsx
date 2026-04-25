import { redirect } from "next/navigation";

export default function ClinicasPage() {
  redirect("/segmentos?tab=clinicas");
}
