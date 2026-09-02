import { FileDown } from "lucide-react";
import {
  patientResources,
  resourcesByCategory,
  resourcePath,
  resourceDownloadName,
} from "@/data/patient-resources";
import { Reveal } from "@/motion/components";

/**
 * Downloadable patient and family education documents.
 *
 * A page as well as the navbar dropdown, so a document can be linked to
 * directly — a nurse sending one to a family needs a URL, not a menu.
 *
 * Each card downloads rather than opening in a viewer: these are printable
 * sheets meant for a fridge or a folder, not for reading on a phone. Page
 * count and file size are stated before the tap, for anyone on mobile data.
 */
export function PatientResourcesPage() {
  const groups = resourcesByCategory();

  return (
    <>
      <section className="bg-gradient-to-b from-[#EAF4FF] via-[#F5F5F5] to-white pb-14 pt-36">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0289E8]">
            Patient Resources
          </p>
          <h1 className="mt-3 text-4xl font-light leading-tight text-[#1B004E] sm:text-5xl">
            Resources for Patient &amp; Family Education
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#444444]">
            Printable guidance from our clinical team on safety at home, infection control, your
            rights as a patient, and the services we provide. Download, print, and keep them where
            the family can see them.
          </p>
          <p className="mt-4 text-sm text-[#777777]">
            {patientResources.length} documents · PDF
          </p>
        </div>
      </section>

      <section className="bg-white pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-8">
          {groups.map((group, groupIndex) => (
            <div key={group.category} className={groupIndex > 0 ? "mt-14" : ""}>
              <Reveal>
                <h2 className="mb-5 text-2xl font-light text-[#1B004E]">{group.category}</h2>
              </Reveal>
              <ul className="grid gap-5 sm:grid-cols-2">
                {group.items.map((resource, index) => (
                  <li key={resource.file}>
                    <Reveal delay={index * 50}>
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
                            PDF · {resource.pages} page{resource.pages === 1 ? "" : "s"} ·{" "}
                            {resource.sizeLabel} · Download
                          </span>
                        </span>
                      </a>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <p className="mt-14 text-center text-sm text-[#777777]">
            These documents are general guidance and do not replace advice from your treating
            clinician. For anything urgent, call 051-111-111-567.
          </p>
        </div>
      </section>
    </>
  );
}
