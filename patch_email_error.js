const fs = require('fs');

const path = 'src/lib/email.ts';
if (fs.existsSync(path)) {
  let code = fs.readFileSync(path, 'utf8');
  
  // Replace the try/catch block to properly handle { data, error } from Resend
  code = code.replace(
    /const data = await resend\.emails\.send\([\s\S]+?console\.log\('Email sent successfully:', data\);\s+return \{ success: true, data \};\s+\} catch \(error\) \{/g,
    `const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'PT. JT Robotic Explorer <admin@roboticexplorer.site>',
      to,
      subject,
      html,
    });
    
    if (error) {
      console.error('Resend API Error:', error);
      return { success: false, error };
    }
    
    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {`
  );
  
  fs.writeFileSync(path, code);
  console.log('Fixed email helper error handling');
}
