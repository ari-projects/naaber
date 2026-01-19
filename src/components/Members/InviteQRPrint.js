import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const InviteQRPrint = forwardRef(({ inviteLink }, ref) => {
  // Билингвальные тексты (эстонский / русский)
  const texts = {
    title: {
      et: 'Lugupeetud elanikud!',
      ru: 'Уважаемые жильцы!'
    },
    description1: {
      et: 'Meie ühistu kasutab nüüd Naaberi rakendust suhtlemiseks, taotluste esitamiseks ja oluliste teadete saamiseks.',
      ru: 'Наше товарищество теперь использует приложение Naaber для общения, подачи заявок и получения важных уведомлений.'
    },
    description2: {
      et: 'Registreeruge, et olla kursis kõigi sündmustega ja saada ühendust haldusega.',
      ru: 'Зарегистрируйтесь, чтобы быть в курсе всех событий и иметь возможность связаться с управлением.'
    },
    features: {
      et: ['Teated', 'Taotlused', 'Hääletused', 'Suhtlus'],
      ru: ['Объявления', 'Заявки', 'Голосования', 'Общение']
    },
    scanInstruction: {
      et: 'Registreerumiseks suunake telefoni kaamera QR-koodile',
      ru: 'Для регистрации наведите камеру телефона на QR-код'
    },
    orVisit: {
      et: 'või külastage',
      ru: 'или перейдите по ссылке'
    }
  };

  return (
    <div 
      ref={ref}
      className="print-container"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '15mm 20mm',
        backgroundColor: 'white',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header with logo */}
      <div style={{ textAlign: 'center', marginBottom: '8mm' }}>
        <img 
          src="/naaber-logotype.png" 
          alt="naaber.ee" 
          style={{ height: '36px' }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </div>

      {/* Main announcement - bilingual */}
      <div style={{ 
        backgroundColor: '#F8F8F7',
        borderRadius: '12px',
        padding: '6mm',
        marginBottom: '6mm',
        border: '1px solid #EBEBEA'
      }}>
        {/* Estonian */}
        <div style={{ marginBottom: '6mm', paddingBottom: '6mm', borderBottom: '1px solid #EBEBEA' }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '700', 
            color: '#0D0C07',
            margin: '0 0 3mm 0',
            fontFamily: "'Lora', Georgia, serif"
          }}>
            🇪🇪 {texts.title.et}
          </h2>
          <p style={{ 
            fontSize: '13px', 
            color: '#0D0C07',
            lineHeight: '1.5',
            margin: '0 0 2mm 0'
          }}>
            {texts.description1.et}
          </p>
          <p style={{ 
            fontSize: '13px', 
            color: '#0D0C07',
            lineHeight: '1.5',
            margin: 0
          }}>
            {texts.description2.et}
          </p>
        </div>

        {/* Russian */}
        <div>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '700', 
            color: '#0D0C07',
            margin: '0 0 3mm 0',
            fontFamily: "'Lora', Georgia, serif"
          }}>
            🇷🇺 {texts.title.ru}
          </h2>
          <p style={{ 
            fontSize: '13px', 
            color: '#0D0C07',
            lineHeight: '1.5',
            margin: '0 0 2mm 0'
          }}>
            {texts.description1.ru}
          </p>
          <p style={{ 
            fontSize: '13px', 
            color: '#0D0C07',
            lineHeight: '1.5',
            margin: 0
          }}>
            {texts.description2.ru}
          </p>
        </div>
      </div>

      {/* Features - bilingual */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '2mm',
        marginBottom: '6mm',
        alignItems: 'center'
      }}>
        {/* Estonian */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: '2mm',
          justifyContent: 'center'
        }}>
          {texts.features.et.map((feature, i) => (
            <span 
              key={i}
              style={{ 
                backgroundColor: '#EBEBEA',
                borderRadius: '6px',
                padding: '2mm 3mm',
                fontSize: '11px',
                color: '#0D0C07'
              }}
            >
              {['📢', '📝', '🗳️', '💬'][i]} {feature}
            </span>
          ))}
        </div>
        {/* Russian */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: '2mm',
          justifyContent: 'center'
        }}>
          {texts.features.ru.map((feature, i) => (
            <span 
              key={i}
              style={{ 
                backgroundColor: '#EBEBEA',
                borderRadius: '6px',
                padding: '2mm 3mm',
                fontSize: '11px',
                color: '#0D0C07'
              }}
            >
              {['📢', '📝', '🗳️', '💬'][i]} {feature}
            </span>
          ))}
        </div>
      </div>

      {/* QR Code Section */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{ 
          fontSize: '12px', 
          color: '#0D0C07',
          marginBottom: '2mm',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          🇪🇪 {texts.scanInstruction.et}
        </p>
        <p style={{ 
          fontSize: '12px', 
          color: '#0D0C07',
          marginBottom: '5mm',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          🇷🇺 {texts.scanInstruction.ru}
        </p>
        
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '5mm',
          border: '2px solid #0D0C07',
          marginBottom: '3mm'
        }}>
          <QRCodeSVG 
            value={inviteLink}
            size={140}
            level="H"
            includeMargin={false}
            style={{ display: 'block' }}
          />
        </div>

        <p style={{ 
          fontSize: '11px', 
          color: '#56554D',
          textAlign: 'center',
          marginBottom: '1mm'
        }}>
          {texts.orVisit.et} / {texts.orVisit.ru}:
        </p>
        <p style={{ 
          fontSize: '12px', 
          color: '#0D0C07',
          textAlign: 'center',
          wordBreak: 'break-all',
          maxWidth: '140mm',
          fontWeight: '500'
        }}>
          {inviteLink}
        </p>
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center',
        paddingTop: '4mm',
        borderTop: '1px solid #EBEBEA',
        marginTop: 'auto'
      }}>
        <p style={{ 
          fontSize: '10px', 
          color: '#86857E',
          margin: 0
        }}>
          Naaber — kaasaegne majavalitsemine / современное управление домом
        </p>
      </div>
    </div>
  );
});

InviteQRPrint.displayName = 'InviteQRPrint';

export default InviteQRPrint;
