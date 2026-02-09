export function generateCertificateHtml(data: {
  recipientName: string;
  eventTitle: string;
  issueDate: string;
  certificateNumber: string;
  personalizedMessage?: string;
}) {
  return `
    <div style="
      width: 800px;
      height: 600px;
      padding: 40px;
      background: white;
      border: 20px solid #06b6d4;
      font-family: 'Inter', system-ui, sans-serif;
      color: #1e293b;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      box-sizing: border-box;
      position: relative;
    ">
      <div style="position: absolute; top: 20px; right: 20px; font-size: 12px; color: #94a3b8;">
        ID: ${data.certificateNumber}
      </div>
      
      <div style="font-size: 48px; font-weight: 800; color: #06b6d4; margin-bottom: 10px;">
        CERTIFICATE
      </div>
      <div style="font-size: 18px; letter-spacing: 4px; color: #64748b; margin-bottom: 40px;">
        OF COMPLETION
      </div>
      
      <div style="font-size: 16px; color: #64748b; margin-bottom: 10px;">
        This is to certify that
      </div>
      <div style="font-size: 32px; font-weight: 700; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; min-width: 300px;">
        ${data.recipientName}
      </div>
      
      <div style="font-size: 16px; color: #64748b; margin-bottom: 10px;">
        has successfully completed the event
      </div>
      <div style="font-size: 24px; font-weight: 600; color: #1e293b; margin-bottom: 30px;">
        ${data.eventTitle}
      </div>
      
      ${data.personalizedMessage ? `
        <div style="font-size: 14px; color: #64748b; font-style: italic; max-width: 500px; margin-bottom: 30px;">
          "${data.personalizedMessage}"
        </div>
      ` : ''}
      
      <div style="display: flex; justify-content: space-between; width: 100%; margin-top: auto;">
        <div style="text-align: left;">
          <div style="font-size: 14px; font-weight: 600; border-top: 1px solid #e2e8f0; padding-top: 5px;">
            ${data.issueDate}
          </div>
          <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">
            Date of Issue
          </div>
        </div>
        
        <div style="text-align: right;">
          <div style="font-size: 14px; font-weight: 600; border-top: 1px solid #e2e8f0; padding-top: 5px; color: #06b6d4;">
            EVENTRA PLATFORM
          </div>
          <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">
            Verified Authority
          </div>
        </div>
      </div>
    </div>
  `;
}
