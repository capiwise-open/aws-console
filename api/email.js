const AWS = require('aws-sdk');
const { getUser } = require('./user/auth');

const ses = new AWS.SES({ region: 'eu-central-1', apiVersion: "2010-12-01" });
const token = process.env.TOKEN_12;

const formatDateToCustomFormat = (date) => {
    // Extract day, month, and year
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
    const year = date.getFullYear();

    // Extract hours and minutes
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const formattedHours = String(hours).padStart(2, '0');

    // Combine date and time
    const formattedDate = `${day}.${month}.${year}`;
    const formattedTime = `${formattedHours}:${minutes} ${ampm}`;

    // Manually add the timezone part
    const timezone = 'EDT';

    // Combine everything
    return `${formattedDate}, ${formattedTime} ${timezone}`;
}

const sendAlertConfirmation = async (alert) => {
    try {
        const { id, user_id, signal, condition, value, type, identifier, createdAt } = alert;
        // const user = await getUser(user_id);
        console.log("sendAlertConfirmation", id, user_id, signal, condition, value, type, identifier);
        let summary;
        try {
            const external_url = `https://api.twelvedata.com/quote?symbol=${identifier}&apikey=${token}`;
            console.log(external_url);
            const r = await fetch(external_url);
            summary = await r.json();
            console.log(summary)
        } catch (e) { 
          console.log(e)
        }

        let params = {
            Destination: {
                ToAddresses: [user_id] // Email address/addresses that you want to send your email
            },
            ConfigurationSetName: "sendEmailSet",
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: `
                            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                            <html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en" style="padding:0;Margin:0">
                            <head>
                            <meta charset="UTF-8">
                            <meta content="width=device-width, initial-scale=1" name="viewport">
                            <meta name="x-apple-disable-message-reformatting">
                            <meta http-equiv="X-UA-Compatible" content="IE=edge">
                            <meta content="telephone=no" name="format-detection">
                            <title>CW-Alert-Confirm</title><!--[if (mso 16)]>
                                <style type="text/css">
                                a {text-decoration: none;}
                                </style>
                                <![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]>
                            <xml>
                                <o:OfficeDocumentSettings>
                                <o:AllowPNG></o:AllowPNG>
                                <o:PixelsPerInch>96</o:PixelsPerInch>
                                </o:OfficeDocumentSettings>
                            </xml>
                            <![endif]-->
                            <style type="text/css">
                            #outlook a {
                                padding:0;
                            }
                            .ExternalClass {
                                width:100%;
                            }
                            .ExternalClass,
                            .ExternalClass p,
                            .ExternalClass span,
                            .ExternalClass font,
                            .ExternalClass td,
                            .ExternalClass div {
                                line-height:100%;
                            }
                            .es-button {
                                mso-style-priority:100!important;
                                text-decoration:none!important;
                            }
                            a[x-apple-data-detectors] {
                                color:inherit!important;
                                text-decoration:none!important;
                                font-size:inherit!important;
                                font-family:inherit!important;
                                font-weight:inherit!important;
                                line-height:inherit!important;
                            }
                            .es-desk-hidden {
                                display:none;
                                float:left;
                                overflow:hidden;
                                width:0;
                                max-height:0;
                                line-height:0;
                                mso-hide:all;
                            }
                            @media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120%!important } h1 { font-size:30px!important; text-align:center } h2 { font-size:22px!important; text-align:center } h3 { font-size:20px!important; text-align:center } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:30px!important } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:22px!important } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important } .es-menu td a { font-size:16px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:14px!important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size:16px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:14px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:inline-block!important } a.es-button, button.es-button { font-size:16px!important; display:inline-block!important } .es-btn-fw { border-width:10px 0px!important; text-align:center!important } .es-adaptive table, .es-btn-fw, .es-btn-fw-brdr, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0px!important } .es-m-p0r { padding-right:0px!important } .es-m-p0l { padding-left:0px!important } .es-m-p0t { padding-top:0px!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important; padding-bottom:10px } .es-desk-hidden { display:table-row!important; width:auto!important; overflow:visible!important; max-height:inherit!important } }
                            @media screen and (max-width:384px) {.mail-message-content { width:414px!important } }
                            </style>
                            </head>
                            <body style="width:100%;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
                            <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#F1FCF6"><!--[if gte mso 9]>
                                        <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                                            <v:fill type="tile" color="#F1FCF6"></v:fill>
                                        </v:background>
                                    <![endif]-->
                            <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F1FCF6">
                                <tr style="border-collapse:collapse">
                                <td valign="top" style="padding:0;Margin:0">
                                <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                                    <tr style="border-collapse:collapse">
                                    <td class="es-adaptive" align="center" style="padding:0;Margin:0">
                                    <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#99c355;width:780px" cellspacing="0" cellpadding="0" bgcolor="#99c355" align="center">
                                        <tr style="border-collapse:collapse">
                                        <td align="left" bgcolor="#2EBD85" style="padding:0;Margin:0;padding-left:20px;padding-right:20px;background-color:#2ebd85">
                                        <table cellspacing="0" cellpadding="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                            <tr style="border-collapse:collapse">
                                            <td align="left" style="padding:0;Margin:0;width:740px">
                                            <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                <tr style="border-collapse:collapse">
                                                <td class="es-infoblock es-m-txt-c" align="left" bgcolor="#2EBD85" style="padding:0;Margin:0;line-height:14px;font-size:12px;color:#FFFFFF"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:14px;color:#FFFFFF;font-size:12px"><br></p></td>
                                                </tr>
                                            </table></td>
                                            </tr>
                                        </table></td>
                                        </tr>
                                    </table></td>
                                    </tr>
                                </table>
                                <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                                    <tr style="border-collapse:collapse">
                                    <td align="center" style="padding:0;Margin:0">
                                    <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:780px">
                                        <tr style="border-collapse:collapse">
                                        <td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px;padding-top:25px"><!--[if mso]><table style="width:740px" cellpadding="0" cellspacing="0"><tr><td style="width:240px" valign="top"><![endif]-->
                                        <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                            <tr style="border-collapse:collapse">
                                            <td class="es-m-p0r es-m-p20b" valign="top" align="center" style="padding:0;Margin:0;width:240px">
                                            <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                <tr style="border-collapse:collapse">
                                                <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src="https://fhmkinn.stripocdn.email/content/guids/CABINET_9ff5d817d10e206994166a84c361eb4adf81ee31d0e00a65d4b9e38ef3eab127/images/logo.png" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" height="50"></td>
                                                </tr>
                                            </table></td>
                                            </tr>
                                        </table><!--[if mso]></td><td style="width:20px"></td><td style="width:480px" valign="top"><![endif]-->
                                        <table class="es-right" cellpadding="0" cellspacing="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                            <tr style="border-collapse:collapse">
                                            <td align="left" style="padding:0;Margin:0;width:480px">
                                            <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                <tr style="border-collapse:collapse">
                                                <td align="left" style="padding:0;Margin:0;padding-bottom:40px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:21px;color:#333333;font-size:14px"><br></p></td>
                                                </tr>
                                            </table></td>
                                            </tr>
                                        </table><!--[if mso]></td></tr></table><![endif]--></td>
                                        </tr>
                                    </table></td>
                                    </tr>
                                </table>
                                <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                                    <tr style="border-collapse:collapse">
                                    <td align="center" style="padding:0;Margin:0">
                                    <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:780px">
                                        <tr style="border-collapse:collapse">
                                        <td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px">
                                        <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                            <tr style="border-collapse:collapse">
                                            <td align="center" valign="top" style="padding:0;Margin:0;width:740px">
                                            <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                <tr style="border-collapse:collapse">
                                                <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-left:10px;padding-right:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:54px;color:#0b1620;font-size:36px"><strong>Your Alert Confirmation</strong></p></td>
                                                </tr>
                                            </table></td>
                                            </tr>
                                        </table></td>
                                        </tr>
                                    </table></td>
                                    </tr>
                                </table>
                                <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                                    <tr style="border-collapse:collapse">
                                    <td align="center" style="padding:0;Margin:0">
                                    <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:780px">
                                        <tr style="border-collapse:collapse">
                                        <td align="left" style="padding:0;Margin:0;padding-right:30px;padding-left:40px"><!--[if mso]><table style="width:710px" cellpadding="0" cellspacing="0"><tr><td style="width:212px" valign="top"><![endif]-->
                                        <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                        </table><!--[if mso]></td><td style="width:10px"></td><td style="width:488px" valign="top"><![endif]-->
                                        <table class="es-right" cellpadding="0" cellspacing="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                            <tr style="border-collapse:collapse">
                                            <td align="left" style="padding:0;Margin:0;width:488px">
                                            <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                <tr style="border-collapse:collapse">
                                                <td align="left" style="padding:0;Margin:0;padding-bottom:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:30px;color:#2ebd85;font-size:20px"><strong>${identifier} (${summary?.name})</strong></p></td>
                                                </tr>
                                            </table></td>
                                            </tr>
                                        </table><!--[if mso]></td></tr></table><![endif]--></td>
                                        </tr>
                                    </table></td>
                                    </tr>
                                </table>
                                <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                                    <tr style="border-collapse:collapse">
                                    <td align="center" style="padding:0;Margin:0">
                                    <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:780px">
                                        <tr style="border-collapse:collapse">
                                        <td align="left" style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px">
                                        <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                            <tr style="border-collapse:collapse">
                                            <td align="center" valign="top" style="padding:0;Margin:0;width:700px">
                                            <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                <tr style="border-collapse:collapse">
                                                <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:21px;color:#0b1620;font-size:14px">Dear,<br><br>We're excited to confirm that your alert has been successfully set!<br><br>Here are the details:</p></td>
                                                </tr>
                                            </table></td>
                                            </tr>
                                        </table></td>
                                        </tr>
                                    </table></td>
                                    </tr>
                                </table>
                                <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                                    <tr style="border-collapse:collapse">
                                    <td align="center" style="padding:0;Margin:0">
                                    <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:780px">
                                        <tr style="border-collapse:collapse">
                                        <td align="left" style="padding:0;Margin:0;padding-left:40px;padding-right:40px"><!--[if mso]><table style="width:700px" cellpadding="0" cellspacing="0"><tr><td style="width:350px" valign="top"><![endif]-->
                                        <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                            <tr style="border-collapse:collapse">
                                            <td class="es-m-p0r es-m-p20b" align="center" style="padding:0;Margin:0;width:350px">
                                            <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                <tr style="border-collapse:collapse">
                                                <td align="left" bgcolor="#2EBD85" style="padding:0;Margin:0;padding-top:5px;padding-left:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:21px;color:#ffffff;font-size:14px">Signal</p></td>
                                                </tr>
                                            </table></td>
                                            </tr>
                                            <tr style="border-collapse:collapse">
                                            <td class="es-m-p0r es-m-p20b" align="center" style="padding:0;Margin:0;width:350px">
                                            <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                <tr style="border-collapse:collapse">
                                                <td align="left" bgcolor="#F1FCF6" style="padding:0;Margin:0;padding-top:5px;padding-bottom:5px;padding-left:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:21px;color:#0b1620;font-size:14px">Condition</p></td>
                                                </tr>
                                                <tr style="border-collapse:collapse">
                                                <td align="left" bgcolor="#F1FCF6" style="padding:0;Margin:0;padding-top:5px;padding-bottom:5px;padding-left:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:21px;color:#0b1620;font-size:14px">Value</p></td>
                                                </tr>
                                                <tr style="border-collapse:collapse">
                                                <td align="left" bgcolor="#F1FCF6" style="padding:0;Margin:0;padding-top:5px;padding-bottom:5px;padding-left:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:21px;color:#0b1620;font-size:14px">Alert type</p></td>
                                                </tr>
                                                <tr style="border-collapse:collapse">
                                                <td align="left" bgcolor="#F1FCF6" style="padding:0;Margin:0;padding-top:5px;padding-bottom:5px;padding-left:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:21px;color:#0b1620;font-size:14px">Alert date</p></td>
                                                </tr>
                                            </table></td>
                                            </tr>
                                        </table><!--[if mso]></td><td style="width:350px" valign="top"><![endif]-->
                                        <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                            <tr style="border-collapse:collapse">
                                            <td align="center" style="padding:0;Margin:0;width:350px">
                                            <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                <tr style="border-collapse:collapse">
                                                <td align="right" bgcolor="#2EBD85" style="padding:0;Margin:0;padding-top:5px;padding-right:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:21px;color:#ffffff;font-size:14px">${signal}</p></td>
                                                </tr>
                                                <tr style="border-collapse:collapse">
                                                <td align="right" bgcolor="#f1fcf6" style="padding:0;Margin:0;padding-top:5px;padding-bottom:5px;padding-right:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:21px;color:#0b1620;font-size:14px"><strong>${condition}</strong></p></td>
                                                </tr>
                                                <tr style="border-collapse:collapse">
                                                <td align="right" bgcolor="#f1fcf6" style="padding:0;Margin:0;padding-top:5px;padding-bottom:5px;padding-right:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:21px;color:#0b1620;font-size:14px"><strong>${signal === 'price' ? ('$' + value) : (value + '%')}</strong></p></td>
                                                </tr>
                                                <tr style="border-collapse:collapse">
                                                <td align="right" bgcolor="#f1fcf6" style="padding:0;Margin:0;padding-top:5px;padding-bottom:5px;padding-right:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:21px;color:#0b1620;font-size:14px"><strong>${type === 'gtc' ? "Good til cancelled" : "During one day"}</strong></p></td>
                                                </tr>
                                                <tr style="border-collapse:collapse">
                                                <td align="right" bgcolor="#f1fcf6" style="padding:0;Margin:0;padding-top:5px;padding-bottom:5px;padding-right:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:21px;color:#0b1620;font-size:14px"><strong>${formatDateToCustomFormat(new Date(createdAt))}</strong></p></td>
                                                </tr>
                                            </table></td>
                                            </tr>
                                        </table><!--[if mso]></td></tr></table><![endif]--></td>
                                        </tr>
                                    </table></td>
                                    </tr>
                                </table>
                                <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                                    <tr style="border-collapse:collapse">
                                    <td align="center" style="padding:0;Margin:0">
                                    <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:780px">
                                        <tr style="border-collapse:collapse">
                                        <td align="left" style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px">
                                        <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                            <tr style="border-collapse:collapse">
                                            <td align="center" valign="top" style="padding:0;Margin:0;width:700px">
                                            <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                <tr style="border-collapse:collapse">
                                                <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:21px;color:#0b1620;font-size:14px">Stay tuned for market updates and happy investing!<br><br>Warm regards,<br><br>Team Capiwise</p></td>
                                                </tr>
                                            </table></td>
                                            </tr>
                                        </table></td>
                                        </tr>
                                    </table></td>
                                    </tr>
                                </table>
                                <table cellpadding="0" cellspacing="0" class="es-footer" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
                                    <tr style="border-collapse:collapse">
                                    <td align="center" style="padding:0;Margin:0">
                                    <table class="es-footer-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#0b1620;width:780px" cellspacing="0" cellpadding="0" bgcolor="#0B1620" align="center">
                                        <tr style="border-collapse:collapse">
                                        <td align="left" style="padding:0;Margin:0;padding-right:20px;padding-top:25px;padding-left:40px"><!--[if mso]><table style="width:720px" cellpadding="0" cellspacing="0"><tr><td style="width:150px" valign="top"><![endif]-->
                                        <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                            <tr style="border-collapse:collapse">
                                            <td class="es-m-p0r es-m-p20b" valign="top" align="center" style="padding:0;Margin:0;width:150px">
                                            <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                <tr style="border-collapse:collapse">
                                                <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src="https://fhmkinn.stripocdn.email/content/guids/CABINET_9ff5d817d10e206994166a84c361eb4adf81ee31d0e00a65d4b9e38ef3eab127/images/logowhite.png" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="150"></td>
                                                </tr>
                                            </table></td>
                                            </tr>
                                        </table><!--[if mso]></td><td style="width:20px"></td><td style="width:550px" valign="top"><![endif]-->
                                        <table class="es-right" cellpadding="0" cellspacing="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                            <tr style="border-collapse:collapse">
                                            <td align="left" style="padding:0;Margin:0;width:550px">
                                            <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                <tr style="border-collapse:collapse">
                                                <td align="left" style="padding:20px;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:20px;color:#333333;font-size:13px"><br></p></td>
                                                </tr>
                                            </table></td>
                                            </tr>
                                        </table><!--[if mso]></td></tr></table><![endif]--></td>
                                        </tr>
                                        <tr style="border-collapse:collapse">
                                        <td align="left" style="padding:0;Margin:0;padding-left:10px;padding-right:10px;padding-top:15px">
                                        <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                            <tr style="border-collapse:collapse">
                                            <td valign="top" align="center" style="padding:0;Margin:0;width:760px">
                                            <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                <tr style="border-collapse:collapse">
                                                <td align="left" style="padding:0;Margin:0;padding-bottom:30px;padding-left:30px;padding-right:30px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:24px;color:#ffffff;font-size:16px">Need help?</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:24px;color:#ffffff;font-size:16px">Contact the help-desk</p></td>
                                                </tr>
                                                <tr style="border-collapse:collapse">
                                                <td align="left" style="padding:0;Margin:0;padding-left:30px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:24px;color:#ffffff;font-size:16px">Follow us</p></td>
                                                </tr>
                                            </table></td>
                                            </tr>
                                        </table></td>
                                        </tr>
                                        <tr style="border-collapse:collapse">
                                        <td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px"><!--[if mso]><table style="width:740px" cellpadding="0" cellspacing="0"><tr><td style="width:240px" valign="top"><![endif]-->
                                        <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                            <tr style="border-collapse:collapse">
                                            <td class="es-m-p0r es-m-p20b" valign="top" align="center" style="padding:0;Margin:0;width:240px">
                                            <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                <tr style="border-collapse:collapse">
                                                <td align="left" style="padding:0;Margin:0;padding-top:10px;padding-left:15px;font-size:0">
                                                <table class="es-table-not-adapt es-social" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                    <tr style="border-collapse:collapse">
                                                    <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><img title="Facebook" src="https://fhmkinn.stripocdn.email/content/assets/img/social-icons/logo-gray/facebook-logo-gray.png" alt="Fb" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></td>
                                                    <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><img title="Youtube" src="https://fhmkinn.stripocdn.email/content/assets/img/social-icons/logo-gray/youtube-logo-gray.png" alt="Yt" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></td>
                                                    <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><img title="LinkedIn" src="https://fhmkinn.stripocdn.email/content/assets/img/social-icons/logo-gray/linkedin-logo-gray.png" alt="In" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></td>
                                                    <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><img title="X" src="https://fhmkinn.stripocdn.email/content/assets/img/social-icons/logo-gray/x-logo-gray.png" alt="X" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></td>
                                                    <td valign="top" align="center" style="padding:0;Margin:0"><img title="Instagram" src="https://fhmkinn.stripocdn.email/content/assets/img/social-icons/logo-gray/instagram-logo-gray.png" alt="Ig" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></td>
                                                    </tr>
                                                </table></td>
                                                </tr>
                                            </table></td>
                                            </tr>
                                        </table><!--[if mso]></td><td style="width:20px"></td><td style="width:480px" valign="top"><![endif]-->
                                        <table class="es-right" cellpadding="0" cellspacing="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                            <tr style="border-collapse:collapse">
                                            <td align="left" style="padding:0;Margin:0;width:480px">
                                            <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                <tr style="border-collapse:collapse">
                                                <td align="right" style="padding:0;Margin:0;padding-right:20px;font-size:0px"><img class="adapt-img" src="https://fhmkinn.stripocdn.email/content/guids/CABINET_9ff5d817d10e206994166a84c361eb4adf81ee31d0e00a65d4b9e38ef3eab127/images/appstore.png" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="346"></td>
                                                </tr>
                                            </table></td>
                                            </tr>
                                        </table><!--[if mso]></td></tr></table><![endif]--></td>
                                        </tr>
                                    </table></td>
                                    </tr>
                                </table>
                                <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                                    <tr style="border-collapse:collapse">
                                    <td align="center" style="padding:0;Margin:0">
                                    <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:780px">
                                        <tr style="border-collapse:collapse">
                                        <td align="left" bgcolor="#0b1620" style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:20px;padding-right:20px;background-color:#0b1620">
                                        <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                            <tr style="border-collapse:collapse">
                                            <td align="center" valign="top" style="padding:0;Margin:0;width:740px">
                                            <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                <tr style="border-collapse:collapse">
                                                <td align="right" style="padding:0;Margin:0;padding-bottom:10px;padding-right:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:21px;color:#ffffff;font-size:14px">© Capiwise. All rights reserved.</p></td>
                                                </tr>
                                            </table></td>
                                            </tr>
                                        </table></td>
                                        </tr>
                                    </table></td>
                                    </tr>
                                </table></td>
                                </tr>
                            </table>
                            </div>
                            </body>
                            </html>`
                    },
                    Text: {
                        Charset: "UTF-8",
                        Data: "Hello World!!!"
                    }
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: "Alert From Capiwise"
                }
            },
            Source: "info@capiwise.com"
        };

        // console.log('params', JSON.stringify(params));
        const sendEmail = ses.sendEmail(params).promise();
        await sendEmail
            .then(data => {
                console.log("email submitted to SES", data);
            })
            .catch(error => {
                console.log("failed email submitted to SES", error);
            });
    } catch (e) {
      console.log("sendAlertConfirmation", e);
    }
}

const sendAlertExpired = async (alert) => {
    try {
        const { id, user_id, signal, condition, value, type, identifier, createdAt } = alert;
        // const user = await getUser(user_id);
        console.log("sendAlertExpired");
        console.log(id, user_id, signal, condition, value, type, identifier);
        let summary;
        try {
            const external_url = `https://api.twelvedata.com/quote?symbol=${identifier}&apikey=${token}`;
            const r = await fetch(external_url);
            summary = await r.json();
        } catch (e) { }

        let params = {
            Destination: {
                ToAddresses: [user_id] // Email address/addresses that you want to send your email
            },
            ConfigurationSetName: "sendEmailSet",
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                        <html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en" style="padding:0;Margin:0">
                         <head>
                          <meta charset="UTF-8">
                          <meta content="width=device-width, initial-scale=1" name="viewport">
                          <meta name="x-apple-disable-message-reformatting">
                          <meta http-equiv="X-UA-Compatible" content="IE=edge">
                          <meta content="telephone=no" name="format-detection">
                          <title>CW-Alert-Triggered</title><!--[if (mso 16)]>
                            <style type="text/css">
                            a {text-decoration: none;}
                            </style>
                            <![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]>
                        <xml>
                            <o:OfficeDocumentSettings>
                            <o:AllowPNG></o:AllowPNG>
                            <o:PixelsPerInch>96</o:PixelsPerInch>
                            </o:OfficeDocumentSettings>
                        </xml>
                        <![endif]-->
                          <style type="text/css">
                        #outlook a {
                            padding:0;
                        }
                        .ExternalClass {
                            width:100%;
                        }
                        .ExternalClass,
                        .ExternalClass p,
                        .ExternalClass span,
                        .ExternalClass font,
                        .ExternalClass td,
                        .ExternalClass div {
                            line-height:100%;
                        }
                        .es-button {
                            mso-style-priority:100!important;
                            text-decoration:none!important;
                        }
                        a[x-apple-data-detectors] {
                            color:inherit!important;
                            text-decoration:none!important;
                            font-size:inherit!important;
                            font-family:inherit!important;
                            font-weight:inherit!important;
                            line-height:inherit!important;
                        }
                        .es-desk-hidden {
                            display:none;
                            float:left;
                            overflow:hidden;
                            width:0;
                            max-height:0;
                            line-height:0;
                            mso-hide:all;
                        }
                        @media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120%!important } h1 { font-size:30px!important; text-align:center } h2 { font-size:22px!important; text-align:center } h3 { font-size:20px!important; text-align:center } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:30px!important } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:22px!important } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important } .es-menu td a { font-size:16px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:14px!important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size:16px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:14px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:inline-block!important } a.es-button, button.es-button { font-size:16px!important; display:inline-block!important } .es-btn-fw { border-width:10px 0px!important; text-align:center!important } .es-adaptive table, .es-btn-fw, .es-btn-fw-brdr, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0px!important } .es-m-p0r { padding-right:0px!important } .es-m-p0l { padding-left:0px!important } .es-m-p0t { padding-top:0px!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important; padding-bottom:10px } .es-desk-hidden { display:table-row!important; width:auto!important; overflow:visible!important; max-height:inherit!important } }
                        @media screen and (max-width:384px) {.mail-message-content { width:414px!important } }
                        </style>
                         </head>
                         <body style="width:100%;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
                          <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#F1FCF6"><!--[if gte mso 9]>
                                    <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                                        <v:fill type="tile" color="#F1FCF6"></v:fill>
                                    </v:background>
                                <![endif]-->
                           <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F1FCF6">
                             <tr style="border-collapse:collapse">
                              <td valign="top" style="padding:0;Margin:0">
                               <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                                 <tr style="border-collapse:collapse">
                                  <td class="es-adaptive" align="center" style="padding:0;Margin:0">
                                   <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#99c355;width:780px" cellspacing="0" cellpadding="0" bgcolor="#99c355" align="center">
                                     <tr style="border-collapse:collapse">
                                      <td align="left" bgcolor="#2EBD85" style="padding:0;Margin:0;padding-left:20px;padding-right:20px;background-color:#2ebd85">
                                       <table cellspacing="0" cellpadding="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                         <tr style="border-collapse:collapse">
                                          <td align="left" style="padding:0;Margin:0;width:740px">
                                           <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td class="es-infoblock es-m-txt-c" align="left" bgcolor="#2EBD85" style="padding:0;Margin:0;line-height:14px;font-size:12px;color:#FFFFFF"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:14px;color:#FFFFFF;font-size:12px"><br></p></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table></td>
                                     </tr>
                                   </table></td>
                                 </tr>
                               </table>
                               <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                                 <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0">
                                   <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:780px">
                                     <tr style="border-collapse:collapse">
                                      <td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px;padding-top:25px"><!--[if mso]><table style="width:740px" cellpadding="0" cellspacing="0"><tr><td style="width:240px" valign="top"><![endif]-->
                                       <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                         <tr style="border-collapse:collapse">
                                          <td class="es-m-p0r es-m-p20b" valign="top" align="center" style="padding:0;Margin:0;width:240px">
                                           <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src="https://fhmkinn.stripocdn.email/content/guids/CABINET_52be309d0b495441e434a303b787aa9258dfcac0c4e9bf54c67c42e3c2e46829/images/logo.png" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" height="50"></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table><!--[if mso]></td><td style="width:20px"></td><td style="width:480px" valign="top"><![endif]-->
                                       <table class="es-right" cellpadding="0" cellspacing="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                         <tr style="border-collapse:collapse">
                                          <td align="left" style="padding:0;Margin:0;width:480px">
                                           <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td align="left" style="padding:0;Margin:0;padding-bottom:40px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:21px;color:#333333;font-size:14px"><br></p></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table><!--[if mso]></td></tr></table><![endif]--></td>
                                     </tr>
                                   </table></td>
                                 </tr>
                               </table>
                               <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                                 <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0">
                                   <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:780px">
                                     <tr style="border-collapse:collapse">
                                      <td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px">
                                       <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                         <tr style="border-collapse:collapse">
                                          <td align="center" valign="top" style="padding:0;Margin:0;width:740px">
                                           <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-left:10px;padding-right:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:54px;color:#0b1620;font-size:36px"><strong>Expired alert target</strong></p></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table></td>
                                     </tr>
                                   </table></td>
                                 </tr>
                               </table>
                               <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                                 <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0">
                                   <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:780px">
                                     <tr style="border-collapse:collapse">
                                      <td align="left" style="padding:0;Margin:0;padding-right:30px;padding-left:40px"><!--[if mso]><table style="width:710px" cellpadding="0" cellspacing="0"><tr><td style="width:212px" valign="top"><![endif]-->
                                       <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                         <tr style="border-collapse:collapse">
                                         </tr>
                                       </table><!--[if mso]></td><td style="width:10px"></td><td style="width:488px" valign="top"><![endif]-->
                                       <table class="es-right" cellpadding="0" cellspacing="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                         <tr style="border-collapse:collapse">
                                          <td align="left" style="padding:0;Margin:0;width:488px">
                                           <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td align="left" style="padding:0;Margin:0;padding-bottom:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:30px;color:#2ebd85;font-size:20px"><strong>${identifier} (${summary?.name})</strong></p></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table><!--[if mso]></td></tr></table><![endif]--></td>
                                     </tr>
                                   </table></td>
                                 </tr>
                               </table>
                               <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                                 <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0">
                                   <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:780px">
                                     <tr style="border-collapse:collapse">
                                      <td align="left" style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px">
                                       <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                         <tr style="border-collapse:collapse">
                                          <td align="center" valign="top" style="padding:0;Margin:0;width:700px">
                                           <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:21px;color:#0b1620;font-size:14px">Dear,<br><br>We would like to point out that the alarm target has expired.</p></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table></td>
                                     </tr>
                                   </table></td>
                                 </tr>
                               </table>
                               <table cellpadding="0" cellspacing="0" class="es-footer" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
                                 <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0">
                                   <table class="es-footer-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#0b1620;width:780px" cellspacing="0" cellpadding="0" bgcolor="#0B1620" align="center">
                                     <tr style="border-collapse:collapse">
                                      <td align="left" style="padding:0;Margin:0;padding-right:20px;padding-top:25px;padding-left:40px"><!--[if mso]><table style="width:720px" cellpadding="0" cellspacing="0"><tr><td style="width:150px" valign="top"><![endif]-->
                                       <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                         <tr style="border-collapse:collapse">
                                          <td class="es-m-p0r es-m-p20b" valign="top" align="center" style="padding:0;Margin:0;width:150px">
                                           <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src="https://fhmkinn.stripocdn.email/content/guids/CABINET_52be309d0b495441e434a303b787aa9258dfcac0c4e9bf54c67c42e3c2e46829/images/logowhite.png" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="150"></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table><!--[if mso]></td><td style="width:20px"></td><td style="width:550px" valign="top"><![endif]-->
                                       <table class="es-right" cellpadding="0" cellspacing="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                         <tr style="border-collapse:collapse">
                                          <td align="left" style="padding:0;Margin:0;width:550px">
                                           <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td align="left" style="padding:20px;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:20px;color:#333333;font-size:13px"><br></p></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table><!--[if mso]></td></tr></table><![endif]--></td>
                                     </tr>
                                     <tr style="border-collapse:collapse">
                                      <td align="left" style="padding:0;Margin:0;padding-left:10px;padding-right:10px;padding-top:15px">
                                       <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                         <tr style="border-collapse:collapse">
                                          <td valign="top" align="center" style="padding:0;Margin:0;width:760px">
                                           <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td align="left" style="padding:0;Margin:0;padding-bottom:30px;padding-left:30px;padding-right:30px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:24px;color:#ffffff;font-size:16px">Need help?</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:24px;color:#ffffff;font-size:16px">Contact the help-desk</p></td>
                                             </tr>
                                             <tr style="border-collapse:collapse">
                                              <td align="left" style="padding:0;Margin:0;padding-left:30px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:24px;color:#ffffff;font-size:16px">Follow us</p></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table></td>
                                     </tr>
                                     <tr style="border-collapse:collapse">
                                      <td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px"><!--[if mso]><table style="width:740px" cellpadding="0" cellspacing="0"><tr><td style="width:240px" valign="top"><![endif]-->
                                       <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                         <tr style="border-collapse:collapse">
                                          <td class="es-m-p0r es-m-p20b" valign="top" align="center" style="padding:0;Margin:0;width:240px">
                                           <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td align="left" style="padding:0;Margin:0;padding-top:10px;padding-left:15px;font-size:0">
                                               <table class="es-table-not-adapt es-social" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                 <tr style="border-collapse:collapse">
                                                  <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><img title="Facebook" src="https://fhmkinn.stripocdn.email/content/assets/img/social-icons/logo-gray/facebook-logo-gray.png" alt="Fb" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></td>
                                                  <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><img title="Youtube" src="https://fhmkinn.stripocdn.email/content/assets/img/social-icons/logo-gray/youtube-logo-gray.png" alt="Yt" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></td>
                                                  <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><img title="LinkedIn" src="https://fhmkinn.stripocdn.email/content/assets/img/social-icons/logo-gray/linkedin-logo-gray.png" alt="In" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></td>
                                                  <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><img title="X" src="https://fhmkinn.stripocdn.email/content/assets/img/social-icons/logo-gray/x-logo-gray.png" alt="X" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></td>
                                                  <td valign="top" align="center" style="padding:0;Margin:0"><img title="Instagram" src="https://fhmkinn.stripocdn.email/content/assets/img/social-icons/logo-gray/instagram-logo-gray.png" alt="Ig" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></td>
                                                 </tr>
                                               </table></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table><!--[if mso]></td><td style="width:20px"></td><td style="width:480px" valign="top"><![endif]-->
                                       <table class="es-right" cellpadding="0" cellspacing="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                         <tr style="border-collapse:collapse">
                                          <td align="left" style="padding:0;Margin:0;width:480px">
                                           <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td align="right" style="padding:0;Margin:0;padding-right:20px;font-size:0px"><img class="adapt-img" src="https://fhmkinn.stripocdn.email/content/guids/CABINET_52be309d0b495441e434a303b787aa9258dfcac0c4e9bf54c67c42e3c2e46829/images/appstore.png" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="346"></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table><!--[if mso]></td></tr></table><![endif]--></td>
                                     </tr>
                                   </table></td>
                                 </tr>
                               </table>
                               <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                                 <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0">
                                   <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:780px">
                                     <tr style="border-collapse:collapse">
                                      <td align="left" bgcolor="#0b1620" style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:20px;padding-right:20px;background-color:#0b1620">
                                       <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                         <tr style="border-collapse:collapse">
                                          <td align="center" valign="top" style="padding:0;Margin:0;width:740px">
                                           <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td align="right" style="padding:0;Margin:0;padding-bottom:10px;padding-right:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:21px;color:#ffffff;font-size:14px">© Capiwise. All rights reserved.</p></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table></td>
                                     </tr>
                                   </table></td>
                                 </tr>
                               </table></td>
                             </tr>
                           </table>
                          </div>
                         </body>
                        </html>`
                    },
                    Text: {
                        Charset: "UTF-8",
                        Data: "Hello World!!!"
                    }
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: "Alert From Capiwise"
                }
            },
            Source: "info@capiwise.com"
        };

        console.log('params', JSON.stringify(params));
        const sendEmail = ses.sendEmail(params).promise();
        await sendEmail
            .then(data => {
                console.log("email submitted to SES", data);
            })
            .catch(error => {
                console.log(error);
            });
    } catch (e) { }
}

const sendAlertTriggered = async (alert) => {

    try {
        const { id, user_id, signal, condition, value, type, identifier, createdAt } = alert;
        // const user = await getUser(user_id);
        console.log("sendAlertTriggered");
        console.log(id, user_id, signal, condition, value, type, identifier);
        let summary;
        try {
            const external_url = `https://api.twelvedata.com/quote?symbol=${identifier}&apikey=${token}`;
            const r = await fetch(external_url);
            summary = await r.json();
        } catch (e) { }

        let params = {
            Destination: {
                ToAddresses: [user_id] // Email address/addresses that you want to send your email
            },
            ConfigurationSetName: "sendEmailSet",
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                        <html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en" style="padding:0;Margin:0">
                         <head>
                          <meta charset="UTF-8">
                          <meta content="width=device-width, initial-scale=1" name="viewport">
                          <meta name="x-apple-disable-message-reformatting">
                          <meta http-equiv="X-UA-Compatible" content="IE=edge">
                          <meta content="telephone=no" name="format-detection">
                          <title>CW-Alert-Triggered</title><!--[if (mso 16)]>
                            <style type="text/css">
                            a {text-decoration: none;}
                            </style>
                            <![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]>
                        <xml>
                            <o:OfficeDocumentSettings>
                            <o:AllowPNG></o:AllowPNG>
                            <o:PixelsPerInch>96</o:PixelsPerInch>
                            </o:OfficeDocumentSettings>
                        </xml>
                        <![endif]-->
                          <style type="text/css">
                        #outlook a {
                            padding:0;
                        }
                        .ExternalClass {
                            width:100%;
                        }
                        .ExternalClass,
                        .ExternalClass p,
                        .ExternalClass span,
                        .ExternalClass font,
                        .ExternalClass td,
                        .ExternalClass div {
                            line-height:100%;
                        }
                        .es-button {
                            mso-style-priority:100!important;
                            text-decoration:none!important;
                        }
                        a[x-apple-data-detectors] {
                            color:inherit!important;
                            text-decoration:none!important;
                            font-size:inherit!important;
                            font-family:inherit!important;
                            font-weight:inherit!important;
                            line-height:inherit!important;
                        }
                        .es-desk-hidden {
                            display:none;
                            float:left;
                            overflow:hidden;
                            width:0;
                            max-height:0;
                            line-height:0;
                            mso-hide:all;
                        }
                        @media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120%!important } h1 { font-size:30px!important; text-align:center } h2 { font-size:22px!important; text-align:center } h3 { font-size:20px!important; text-align:center } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:30px!important } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:22px!important } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important } .es-menu td a { font-size:16px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:14px!important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size:16px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:14px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:inline-block!important } a.es-button, button.es-button { font-size:16px!important; display:inline-block!important } .es-btn-fw { border-width:10px 0px!important; text-align:center!important } .es-adaptive table, .es-btn-fw, .es-btn-fw-brdr, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0px!important } .es-m-p0r { padding-right:0px!important } .es-m-p0l { padding-left:0px!important } .es-m-p0t { padding-top:0px!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important; padding-bottom:10px } .es-desk-hidden { display:table-row!important; width:auto!important; overflow:visible!important; max-height:inherit!important } }
                        @media screen and (max-width:384px) {.mail-message-content { width:414px!important } }
                        </style>
                         </head>
                         <body style="width:100%;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
                          <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#F1FCF6"><!--[if gte mso 9]>
                                    <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                                        <v:fill type="tile" color="#F1FCF6"></v:fill>
                                    </v:background>
                                <![endif]-->
                           <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F1FCF6">
                             <tr style="border-collapse:collapse">
                              <td valign="top" style="padding:0;Margin:0">
                               <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                                 <tr style="border-collapse:collapse">
                                  <td class="es-adaptive" align="center" style="padding:0;Margin:0">
                                   <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#99c355;width:780px" cellspacing="0" cellpadding="0" bgcolor="#99c355" align="center">
                                     <tr style="border-collapse:collapse">
                                      <td align="left" bgcolor="#2EBD85" style="padding:0;Margin:0;padding-left:20px;padding-right:20px;background-color:#2ebd85">
                                       <table cellspacing="0" cellpadding="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                         <tr style="border-collapse:collapse">
                                          <td align="left" style="padding:0;Margin:0;width:740px">
                                           <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td class="es-infoblock es-m-txt-c" align="left" bgcolor="#2EBD85" style="padding:0;Margin:0;line-height:14px;font-size:12px;color:#FFFFFF"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:14px;color:#FFFFFF;font-size:12px"><br></p></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table></td>
                                     </tr>
                                   </table></td>
                                 </tr>
                               </table>
                               <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                                 <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0">
                                   <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:780px">
                                     <tr style="border-collapse:collapse">
                                      <td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px;padding-top:25px"><!--[if mso]><table style="width:740px" cellpadding="0" cellspacing="0"><tr><td style="width:240px" valign="top"><![endif]-->
                                       <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                         <tr style="border-collapse:collapse">
                                          <td class="es-m-p0r es-m-p20b" valign="top" align="center" style="padding:0;Margin:0;width:240px">
                                           <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src="https://fhmkinn.stripocdn.email/content/guids/CABINET_52be309d0b495441e434a303b787aa9258dfcac0c4e9bf54c67c42e3c2e46829/images/logo.png" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" height="50"></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table><!--[if mso]></td><td style="width:20px"></td><td style="width:480px" valign="top"><![endif]-->
                                       <table class="es-right" cellpadding="0" cellspacing="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                         <tr style="border-collapse:collapse">
                                          <td align="left" style="padding:0;Margin:0;width:480px">
                                           <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td align="left" style="padding:0;Margin:0;padding-bottom:40px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:21px;color:#333333;font-size:14px"><br></p></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table><!--[if mso]></td></tr></table><![endif]--></td>
                                     </tr>
                                   </table></td>
                                 </tr>
                               </table>
                               <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                                 <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0">
                                   <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:780px">
                                     <tr style="border-collapse:collapse">
                                      <td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px">
                                       <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                         <tr style="border-collapse:collapse">
                                          <td align="center" valign="top" style="padding:0;Margin:0;width:740px">
                                           <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-left:10px;padding-right:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:54px;color:#0b1620;font-size:36px"><strong>Your Alert triggered</strong></p></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table></td>
                                     </tr>
                                   </table></td>
                                 </tr>
                               </table>
                               <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                                 <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0">
                                   <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:780px">
                                     <tr style="border-collapse:collapse">
                                      <td align="left" style="padding:0;Margin:0;padding-right:30px;padding-left:40px"><!--[if mso]><table style="width:710px" cellpadding="0" cellspacing="0"><tr><td style="width:212px" valign="top"><![endif]-->
                                       <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                       </table><!--[if mso]></td><td style="width:10px"></td><td style="width:488px" valign="top"><![endif]-->
                                       <table class="es-right" cellpadding="0" cellspacing="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                         <tr style="border-collapse:collapse">
                                          <td align="left" style="padding:0;Margin:0;width:488px">
                                           <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td align="left" style="padding:0;Margin:0;padding-bottom:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:30px;color:#2ebd85;font-size:20px"><strong>${identifier} (${summary?.name})</strong></p></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table><!--[if mso]></td></tr></table><![endif]--></td>
                                     </tr>
                                   </table></td>
                                 </tr>
                               </table>
                               <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                                 <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0">
                                   <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:780px">
                                     <tr style="border-collapse:collapse">
                                      <td align="left" style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px">
                                       <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                         <tr style="border-collapse:collapse">
                                          <td align="center" valign="top" style="padding:0;Margin:0;width:700px">
                                           <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:21px;color:#0b1620;font-size:14px">Dear,<br><br>We're thrilled to inform that your alert has been triggered!</p></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table></td>
                                     </tr>
                                   </table></td>
                                 </tr>
                               </table>
                               <table cellpadding="0" cellspacing="0" class="es-footer" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
                                 <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0">
                                   <table class="es-footer-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#0b1620;width:780px" cellspacing="0" cellpadding="0" bgcolor="#0B1620" align="center">
                                     <tr style="border-collapse:collapse">
                                      <td align="left" style="padding:0;Margin:0;padding-right:20px;padding-top:25px;padding-left:40px"><!--[if mso]><table style="width:720px" cellpadding="0" cellspacing="0"><tr><td style="width:150px" valign="top"><![endif]-->
                                       <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                         <tr style="border-collapse:collapse">
                                          <td class="es-m-p0r es-m-p20b" valign="top" align="center" style="padding:0;Margin:0;width:150px">
                                           <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src="https://fhmkinn.stripocdn.email/content/guids/CABINET_52be309d0b495441e434a303b787aa9258dfcac0c4e9bf54c67c42e3c2e46829/images/logowhite.png" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="150"></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table><!--[if mso]></td><td style="width:20px"></td><td style="width:550px" valign="top"><![endif]-->
                                       <table class="es-right" cellpadding="0" cellspacing="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                         <tr style="border-collapse:collapse">
                                          <td align="left" style="padding:0;Margin:0;width:550px">
                                           <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td align="left" style="padding:20px;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:20px;color:#333333;font-size:13px"><br></p></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table><!--[if mso]></td></tr></table><![endif]--></td>
                                     </tr>
                                     <tr style="border-collapse:collapse">
                                      <td align="left" style="padding:0;Margin:0;padding-left:10px;padding-right:10px;padding-top:15px">
                                       <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                         <tr style="border-collapse:collapse">
                                          <td valign="top" align="center" style="padding:0;Margin:0;width:760px">
                                           <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td align="left" style="padding:0;Margin:0;padding-bottom:30px;padding-left:30px;padding-right:30px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:24px;color:#ffffff;font-size:16px">Need help?</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:24px;color:#ffffff;font-size:16px">Contact the help-desk</p></td>
                                             </tr>
                                             <tr style="border-collapse:collapse">
                                              <td align="left" style="padding:0;Margin:0;padding-left:30px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:24px;color:#ffffff;font-size:16px">Follow us</p></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table></td>
                                     </tr>
                                     <tr style="border-collapse:collapse">
                                      <td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px"><!--[if mso]><table style="width:740px" cellpadding="0" cellspacing="0"><tr><td style="width:240px" valign="top"><![endif]-->
                                       <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                         <tr style="border-collapse:collapse">
                                          <td class="es-m-p0r es-m-p20b" valign="top" align="center" style="padding:0;Margin:0;width:240px">
                                           <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td align="left" style="padding:0;Margin:0;padding-top:10px;padding-left:15px;font-size:0">
                                               <table class="es-table-not-adapt es-social" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                 <tr style="border-collapse:collapse">
                                                  <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><img title="Facebook" src="https://fhmkinn.stripocdn.email/content/assets/img/social-icons/logo-gray/facebook-logo-gray.png" alt="Fb" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></td>
                                                  <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><img title="Youtube" src="https://fhmkinn.stripocdn.email/content/assets/img/social-icons/logo-gray/youtube-logo-gray.png" alt="Yt" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></td>
                                                  <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><img title="LinkedIn" src="https://fhmkinn.stripocdn.email/content/assets/img/social-icons/logo-gray/linkedin-logo-gray.png" alt="In" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></td>
                                                  <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><img title="X" src="https://fhmkinn.stripocdn.email/content/assets/img/social-icons/logo-gray/x-logo-gray.png" alt="X" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></td>
                                                  <td valign="top" align="center" style="padding:0;Margin:0"><img title="Instagram" src="https://fhmkinn.stripocdn.email/content/assets/img/social-icons/logo-gray/instagram-logo-gray.png" alt="Ig" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></td>
                                                 </tr>
                                               </table></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table><!--[if mso]></td><td style="width:20px"></td><td style="width:480px" valign="top"><![endif]-->
                                       <table class="es-right" cellpadding="0" cellspacing="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                         <tr style="border-collapse:collapse">
                                          <td align="left" style="padding:0;Margin:0;width:480px">
                                           <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td align="right" style="padding:0;Margin:0;padding-right:20px;font-size:0px"><img class="adapt-img" src="https://fhmkinn.stripocdn.email/content/guids/CABINET_52be309d0b495441e434a303b787aa9258dfcac0c4e9bf54c67c42e3c2e46829/images/appstore.png" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="346"></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table><!--[if mso]></td></tr></table><![endif]--></td>
                                     </tr>
                                   </table></td>
                                 </tr>
                               </table>
                               <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                                 <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0">
                                   <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:780px">
                                     <tr style="border-collapse:collapse">
                                      <td align="left" bgcolor="#0b1620" style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:20px;padding-right:20px;background-color:#0b1620">
                                       <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                         <tr style="border-collapse:collapse">
                                          <td align="center" valign="top" style="padding:0;Margin:0;width:740px">
                                           <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                             <tr style="border-collapse:collapse">
                                              <td align="right" style="padding:0;Margin:0;padding-bottom:10px;padding-right:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;line-height:21px;color:#ffffff;font-size:14px">© Capiwise. All rights reserved.</p></td>
                                             </tr>
                                           </table></td>
                                         </tr>
                                       </table></td>
                                     </tr>
                                   </table></td>
                                 </tr>
                               </table></td>
                             </tr>
                           </table>
                          </div>
                         </body>
                        </html>`
                    },
                    Text: {
                        Charset: "UTF-8",
                        Data: "Hello World!!!"
                    }
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: "Alert From Capiwise"
                }
            },
            Source: "info@capiwise.com"
        };

        console.log('params', JSON.stringify(params));
        const sendEmail = ses.sendEmail(params).promise();
        await sendEmail
            .then(data => {
                console.log("email submitted to SES", data);
            })
            .catch(error => {
                console.log(error);
            });
    } catch (e) { }
}

module.exports = {
    sendAlertConfirmation,
    sendAlertExpired,
    sendAlertTriggered
}