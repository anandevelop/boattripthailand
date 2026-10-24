module.exports = Object.assign({content:['./site/shell.html','./public/site/app.js']}, {
    theme: {
      borderRadius: { none:'0', xs:'8px', sm:'10px', DEFAULT:'12px', md:'12px', lg:'14px', xl:'18px', '2xl':'22px', '3xl':'28px', full:'9999px', overlay:'22px', circle:'9999px', card:'18px', pill:'9999px' }, /* rounded scale */
      fontSize: {
        xs:  ['11px', '16px'],   /* font.size.xs */
        sm:  ['13px', '19px'],   /* font.size.sm = base */
        base:['13px', '19px'],
        md:  ['14px', '20px'],   /* font.size.md */
        lg:  ['16px', '22px'],   /* font.size.lg */
        xl:  ['17px', '23px'],   /* font.size.xl */
        '2xl':['20px', '26px'],  /* font.size.2xl */
        '3xl':['26px', '32px'],  /* font.size.3xl */
        '4xl':['30px', '36px'],  /* font.size.4xl */
        '5xl':['44px', '48px'],  /* font.size.display (hero only) */
      },
      extend: {
        maxWidth: { '7xl':'1280px' },
        colors: {
          /* semantic */
          ink: '#231416',          /* color.text.primary (warm near-black) */
          muted: '#6b5e60',        /* color.text.secondary */
          tertiary: '#5e5254',     /* color.text.tertiary */
          line: '#e2d8d8',         /* color.border.default */
          'line-strong': '#8a7a7c',/* color.border.muted */
          /* brand action (BTT) — the only accent */
          maroon: { DEFAULT:'#70000e', 50:'#f9f1f2', 100:'#f2e2e4', 200:'#e3c5c9', 400:'#8a0012', 600:'#5e000c', 700:'#70000e', 800:'#4f000a', 900:'#3a0007' },
          /* legacy aliases remapped to neutral tokens (no off-system hues) */
          lagoon: { DEFAULT:'#70000e', 50:'#f9f1f2', 100:'#f2e2e4', 400:'#70000e', 500:'#70000e', 600:'#70000e', 700:'#70000e' },
          sun:    { DEFAULT:'#ffffff', 100:'#f9f1f2', 400:'#f2e2e4', 500:'#ffffff', 600:'#70000e' },
          sand:   { DEFAULT:'#f8f4f3', 100:'#f1eaea', 200:'#e2d8d8' },
        },
        fontFamily: {
          sans: ['Futura', 'Jost', '"IBM Plex Sans Thai"', 'Verdana', 'sans-serif'],
          display: ['Futura', 'Jost', '"IBM Plex Sans Thai"', 'Verdana', 'sans-serif'],
        },
        spacing: { t1:'8px', t2:'12px', t3:'16px', t4:'24px', t5:'48px', t6:'120px', t7:'120px' }, /* space.1 = 8px (minimum) */
        boxShadow: { card:'none', float:'0 16px 40px -20px rgba(58,0,7,.35)' },
        transitionDuration: { instant:'200ms', fast:'300ms' },
      }
    }
  });