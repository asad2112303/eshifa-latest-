import { FileDown } from "lucide-react";
import {
  patientResources,
  resourcePath,
  resourceDownloadName,
} from "@/data/patient-resources";
import { Reveal } from "@/motion/components";

/**
 * Downloadable patient and family education leaflets.
 *
 * A page as well as the navbar dropdown, so the leaflets can be linked to
 * directly — a nurse sending one to a family needs a URL, not a menu.
 *
 * Each card downloads rather than opening in a viewer: these are printable
 * A4 sheets meant to go on a fridge or into a folder, not to be read on a
 * phone. The size is stated before the tap, for anyone on mobile data.
 */
export function PatientResourcesPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-[#EAF4FF] via-[#F5F5F5] to-white pb-16 pt-36">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0289E8]">
            Patient Resources
          </p>
          <h1 className="mt-3 text-4xl font-light leading-tight text-[#1B004E] sm:text-5xl">
            Resources for Patient &amp; Family Education
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#444444]">
            Printable guidance from our clinical team on infection control, safety at home and who
            to contact in an emergency. Download, print and keep them where the family can see them.
          </p>
        </div>
      </section>

      <section className="bg-white pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-8">
          <ul className="grid gap-5 sm:grid-cols-2">
            {patientResources.map((resource, index) => (
              <li key={resource.file}>
                <Reveal delay={index * 60}>
                  <a
                    href={resourcePath(resource)}
                    download={resourceDownloadName(resource)}
                    className="group flex h-full items-start gap-4 rounded-3xl border border-[#E6E9EF] bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0289E8]/10 text-[#0289E8]">
                      <FileDown className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-lg font-semibold leading-snug text-[#1B004E] group-hover:text-[#0289E8]">
                        {resource.title}
                      </span>
                      <span className="mt-1.5 block text-sm leading-relaxed text-[#555555]">
                        {resource.description}
                      </span>
                      <span className="mt-3 block text-xs uppercase tracking-wide text-[#9AA1AC]">
                        PDF · {resource.sizeLabel} · Download
                      </span>
                    </span>
                  </a>
                </Reveal>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-center text-sm text-[#777777]">
            These leaflets are general guidance and do not replace advice from your treating
            clinician. For anything urgent, call 051-111-111-567.
          </p>
        </div>
      </section>
    </>
  );
}
