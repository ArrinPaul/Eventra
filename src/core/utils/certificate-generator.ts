/**
 * Converts a JSON layout from the Certificate Builder into renderable HTML.
 */
export function generateHtmlFromLayout(layout: {
  backgroundUrl: string;
  width: number;
  height: number;
  fields: any[];
}) {
  const fieldsHtml = layout.fields.map(field => `
    <div style="
      position: absolute;
      left: ${field.x}%;
      top: ${field.y}%;
      transform: translate(-50%, -50%);
      font-size: ${field.fontSize}px;
      color: ${field.color};
      font-weight: ${field.fontWeight};
      font-family: 'serif';
      white-space: nowrap;
    ">
      ${field.value}
    </div>
  `).join('');

  return `
    <div style="
      width: ${layout.width}px;
      height: ${layout.height}px;
      position: relative;
      overflow: hidden;
      background-image: ${layout.backgroundUrl ? `url(${layout.backgroundUrl})` : 'none'};
      background-size: cover;
      background-position: center;
      background-color: white;
    ">
      ${fieldsHtml}
    </div>
  `;
}

export function generateCertificateHtml(data: {
  recipientName: string;
  eventTitle: string;
  issueDate: string;
  certificateNumber: string;
  personalizedMessage?: string;
}) {
  return `
    <div style="width: 800px; height: 600px; padding: 40px; border: 20px solid #1a1a1a; background: #fff; text-align: center; font-family: 'serif';">
      <div style="border: 5px solid #d4af37; height: 100%; padding: 40px; box-sizing: border-box;">
        <h1 style="font-size: 50px; color: #1a1a1a; margin-bottom: 20px;">CERTIFICATE</h1>
        <p style="font-size: 20px; color: #666;">OF ACHIEVEMENT</p>
        <div style="margin: 40px 0;">
          <p style="font-size: 18px; color: #666;">THIS IS TO CERTIFY THAT</p>
          <h2 style="font-size: 36px; color: #1a1a1a; border-bottom: 2px solid #1a1a1a; display: inline-block; padding: 0 40px;">${data.recipientName}</h2>
        </div>
        <p style="font-size: 18px; color: #666;">HAS SUCCESSFULLY COMPLETED</p>
        <h3 style="font-size: 28px; color: #1a1a1a;">${data.eventTitle}</h3>
        <div style="margin-top: 60px; display: flex; justify-content: space-between; padding: 0 40px;">
          <div style="text-align: center;">
            <p style="border-top: 1px solid #1a1a1a; padding-top: 10px; width: 200px;">Date: ${data.issueDate}</p>
          </div>
          <div style="text-align: center;">
            <p style="border-top: 1px solid #1a1a1a; padding-top: 10px; width: 200px;">ID: ${data.certificateNumber}</p>
          </div>
        </div>
        ${data.personalizedMessage ? `<p style="margin-top: 30px; font-style: italic; color: #666;">"${data.personalizedMessage}"</p>` : ''}
      </div>
    </div>
  `;
}
