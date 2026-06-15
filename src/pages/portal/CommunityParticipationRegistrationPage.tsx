import { useNavigate } from "react-router";
import { ClipboardList, Sprout, Users2 } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PortalServiceFormSection from "./components/PortalServiceFormSection";
import ServiceExitButton from "./components/ServiceExitButton";
import { usePortalContent } from "@/hooks/usePortalContent";

const initiatives = [
  {
    title: "Neighborhood clean-ups",
    description: "Join monthly green initiatives",
    icon: "🧹",
  },
  {
    title: "Community workshops",
    description: "Skills, safety, and civic education",
    icon: "👥",
  },
  {
    title: "Volunteer network",
    description: "Support local events & outreach",
    icon: "📋",
  },
];

const stats = [
  { value: "1,240+", label: "Active Members" },
  { value: "47", label: "Initiatives This Year" },
  { value: "12", label: "Local Chapters" },
];

const CommunityParticipationRegistrationPage = () => {
  const navigate = useNavigate();
  const { portalContent } = usePortalContent();
  const sectionsVisibility = portalContent?.sectionsVisibility;
  const showHeader = sectionsVisibility?.header !== false;
  const showFooter = sectionsVisibility?.footer !== false;
  const showContact = sectionsVisibility?.contact !== false;

  return (
    <div className="portal-theme min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#F8FBF7_0%,#FFFFFF_28%,#F7FAF6_100%)] font-outfit">
      <PageMeta
        title="Community Participation Registration | IDRMIS Portal"
        description="Register to participate in community initiatives."
      />
      {showHeader ? <Header branding={portalContent?.branding} header={portalContent?.header} /> : null}

      <main className="px-5 pb-20 pt-24 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <ServiceExitButton
              onClick={() => navigate("/portal/services")}
              className="border-[#DCE9DD] bg-white text-[#4C6B58] hover:border-[#AFCBB4] hover:text-[#234A37]"
            />
          </div>

          <section className="rounded-[34px] border border-[#E1EBE2] bg-white/95 px-6 py-7 shadow-[0_24px_60px_-30px_rgba(35,74,55,0.26)] sm:px-11 sm:py-10">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3FAF2] text-3xl">
                🌱
              </div>
              <div className="inline-flex rounded-full bg-[#EEF6EE] px-5 py-2 text-lg font-bold text-[#4D7A5E]">
                Join local action
              </div>
            </div>

            <div className="mt-8 max-w-2xl">
              <h1 className="text-[2.6rem] font-black tracking-[-0.03em] text-[#234A37] sm:text-[3.5rem]">
                Community Participation Registration
              </h1>
              <p className="mt-5 text-xl font-medium leading-8 text-[#61806D] sm:text-[2rem] sm:leading-10">
                Register to participate in community initiatives.
              </p>
            </div>

            <div className="mt-9">
              <button
                onClick={() =>
                  document.getElementById("community-initiatives")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
                className="inline-flex min-h-18 items-center justify-center rounded-full bg-[#2E7751] px-10 py-5 text-[1.7rem] font-black text-white shadow-[0_20px_36px_-24px_rgba(46,119,81,0.9)] transition hover:translate-y-[-1px] hover:bg-[#266644] sm:min-w-[270px]"
              >
                Open service
                <span className="ml-3 text-[2rem] leading-none">&rarr; &rarr;</span>
              </button>
            </div>

            <div id="community-initiatives" className="mt-12 space-y-5">
              {initiatives.map((initiative, index) => {
                const iconBg =
                  index === 0 ? "bg-[#EFF8F1]" : index === 1 ? "bg-[#EEF5F0]" : "bg-[#EEF6F3]";
                return (
                  <div
                    key={initiative.title}
                    className="flex items-center gap-5 rounded-[28px] border border-[#DCE9DD] bg-[linear-gradient(180deg,#FBFEFA_0%,#F9FCF7_100%)] px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:px-7"
                  >
                    <div className={`flex h-18 w-18 shrink-0 items-center justify-center rounded-full ${iconBg} text-[2.25rem]`}>
                      {initiative.icon}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-[1.85rem] font-black tracking-[-0.02em] text-[#284736] sm:text-[2.1rem]">
                        {initiative.title}
                      </h2>
                      <p className="mt-2 text-xl font-medium text-[#72907E] sm:text-[1.9rem]">
                        {initiative.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-9 grid gap-4 rounded-[30px] bg-[#F1F7F3] px-6 py-7 sm:grid-cols-3 sm:px-10">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-[2.3rem] font-black tracking-[-0.03em] text-[#276C55] sm:text-[3rem]">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-base font-medium uppercase tracking-[0.14em] text-[#517567] sm:text-lg">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 border-t border-[#E2EBE2] pt-7 text-lg font-medium text-[#6F8979] sm:text-[1.55rem]">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="text-xl">🤝</span>
                <span>Free registration</span>
                <span>·</span>
                <span>Open to all residents</span>
                <span>·</span>
                <span>Make a difference locally</span>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border border-[#E2ECE3] bg-[#FCFEFC] p-5">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF7EF] text-[#2E7751]">
                  <Sprout className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-[#284736]">Environmental action</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-[#6C8878]">
                  Support tree planting, clean surroundings, and greener neighborhoods.
                </p>
              </div>

              <div className="rounded-[24px] border border-[#E2ECE3] bg-[#FCFEFC] p-5">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF7EF] text-[#2E7751]">
                  <Users2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-[#284736]">Shared learning</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-[#6C8878]">
                  Join workshops that build practical civic, safety, and teamwork skills.
                </p>
              </div>

              <div className="rounded-[24px] border border-[#E2ECE3] bg-[#FCFEFC] p-5">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF7EF] text-[#2E7751]">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-[#284736]">Simple onboarding</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-[#6C8878]">
                  Register once, discover initiatives, and choose how you want to help.
                </p>
              </div>
            </div>

            <div className="mt-10">
              <PortalServiceFormSection
                service={{
                  title: "Community Participation Registration",
                  description: "Register to participate in community initiatives.",
                  slug: "community-registration",
                  templateSearch: "Community Participation Registration",
                  moduleContextType: "CommunityParticipationRegistration",
                }}
                cardClassName="rounded-[30px] border border-[#DFE9DF] bg-[#FCFEFC] p-5 shadow-[0_26px_55px_-35px_rgba(35,74,55,0.25)] sm:p-7"
                title="Registration form"
                subtitle="Sign up for local initiatives, volunteer programs, and community workshops."
                emptyTitle="Registration form unavailable"
                emptyDescription="A published registration form has not been configured for this service yet."
              />
            </div>
          </section>
        </div>
      </main>

      {showFooter ? (
        <Footer
          branding={portalContent?.branding}
          contact={portalContent?.contact}
          footer={portalContent?.footer}
          showContact={showContact}
        />
      ) : null}
    </div>
  );
};

export default CommunityParticipationRegistrationPage;
