/** Section heading with optional description and right-side action. */
export default function SectionHead({ title, description, action }) {
  return (
    <div className="fs-section-head">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
