import { useEffect, useState } from "react";
import { CheckCircle2, HelpCircle, Sparkles } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/api/axios";
import FormRenderer from "@/components/TemplateEngine/FormRenderer/FormRenderer";
import RichTextDisplay from "@/components/common/RichTextDisplay";

type PortalService = {
  title: string;
  description: string;
  slug: string;
  templateSearch?: string;
  moduleContextType?: string;
};

type PortalServiceFormSectionProps = {
  service: PortalService;
  cardClassName?: string;
  title?: string;
  subtitle?: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

const PortalServiceFormSection = ({
  service,
  cardClassName = "bg-white rounded-[40px] p-6 md:p-10 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.15)] border border-slate-100",
  title = "Service form",
  subtitle = "Complete the form below to submit your request.",
  emptyTitle = "Service form unavailable",
  emptyDescription = "No published form is configured for this service yet. Please try again later.",
}: PortalServiceFormSectionProps) => {
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true);
        setTemplate(null);
        setSubmitted(false);

        const response = await api.get(
          `/templates?status=Published&search=${encodeURIComponent(
            service.templateSearch || service.title
          )}`
        );

        if (response.data && response.data.length > 0) {
          setTemplate(response.data[0]);
        } else {
          setTemplate(null);
        }
      } catch (error) {
        console.error("Error loading service template:", error);
        setTemplate(null);
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [service.moduleContextType, service.slug, service.templateSearch, service.title]);

  const onSubmit = async (data: any) => {
    if (!template) return;

    try {
      const payload = {
        templateId: template._id,
        templateVersion: template.version,
        moduleContextId: template._id,
        moduleContextType: service.moduleContextType || "PortalService",
        answers: data,
        respondentMetadata: {
          fullName: "Portal User",
          submittedAt: new Date().toISOString(),
          source: "Public Portal",
          service: service.title,
          serviceSlug: service.slug,
        },
      };

      await api.post("/responses", payload);
      toast.success("Submitted successfully.");
      setSubmitted(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit");
    }
  };

  return (
    <section id={`${service.slug}-form`} className={cardClassName}>
      {loading ? (
        <div className="py-16 text-center">
          <div className="relative mx-auto w-fit">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
            <Sparkles className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-brand-600" />
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
            Loading service form...
          </p>
        </div>
      ) : !template ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-rose-50 text-rose-500">
            <HelpCircle size={40} />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">{emptyTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-medium leading-relaxed text-slate-500">
            {emptyDescription}
          </p>
        </div>
      ) : submitted ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
            <CheckCircle2 size={54} />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Submission received
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg font-medium text-slate-500">
            Your request has been submitted successfully.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="mt-8 rounded-2xl bg-accent-600 px-8 py-4 text-base font-black text-white transition hover:bg-accent-700"
          >
            Submit another response
          </button>
        </div>
      ) : (
        <>
          <div className="mb-6 px-2 text-center md:mb-8">
            <h2 className="text-3xl font-black tracking-tight text-slate-950">{title}</h2>
            <RichTextDisplay
              html={subtitle}
              className="mx-auto mt-3 max-w-2xl text-lg font-medium text-slate-500 [&_a]:text-brand-600 [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_p]:mb-3 [&_p:last-child]:mb-0"
            />
          </div>
          <FormRenderer template={template} onSubmit={onSubmit} />
        </>
      )}
    </section>
  );
};

export default PortalServiceFormSection;
