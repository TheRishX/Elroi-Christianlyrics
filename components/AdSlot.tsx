import { getAdSettings } from "@/lib/api";

export async function AdSlot({ placement }: { placement: string }) {
  const settings = await getAdSettings();
  if (settings) {
    const slot = settings.placements?.[placement];
    if (!settings.global || !slot?.enabled || (!slot.code && !slot.imageUrl)) return null;
    const content = slot.imageUrl ? <img src={slot.imageUrl} alt={slot.imageAlt || "Advertisement"} /> : <div dangerouslySetInnerHTML={{ __html: slot.code || "" }} />;
    return slot.linkUrl ? <a className="ad-slot" data-placement={placement} href={slot.linkUrl} target={slot.openNewTab ? "_blank" : undefined} rel={slot.openNewTab ? "noreferrer" : undefined} aria-label="Advertisement">{content}</a> : <div className="ad-slot" data-placement={placement} aria-label="Advertisement">{content}</div>;
  }
  if (process.env.NEXT_PUBLIC_ADS_ENABLED !== "true") return null;
  return <div className="ad-slot" data-placement={placement} aria-label="Advertisement">Advertisement</div>;
}
