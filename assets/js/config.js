/* =========================================================================
   UNIFORMEWEB · ARCHIVO DE CONFIGURACIÓN
   -------------------------------------------------------------------------
   Aquí se edita casi todo el sitio sin tocar el diseño:
   - Datos de contacto (correo, WhatsApp)
   - Categorías del menú y las fotos de cada una
   Para agregar una foto: copie una línea dentro de "fotos" y cambie el nombre.
   ========================================================================= */

window.UW = {
  /* ---------- CONTACTO ---------- */
  correo: "cotizaciones@uniformeweb.cl",
  // Correo donde llegan las solicitudes de los formularios.
  correoFormularios: "cotizaciones@uniformeweb.cl",
  // Número para los botones de WhatsApp: solo dígitos, con 56 al inicio.
  whatsapp: "56977235026",
  // Cómo se muestra el número en pantalla.
  whatsappTexto: "+56 9 7723 5026",
  mensajeWhatsapp: "Hola Uniformeweb, quiero cotizar ropa corporativa con logo.",

  /* ---------- IMÁGENES ----------
     false = las fotos se cargan desde el servidor de Wix (funciona hoy).
     true  = las fotos se cargan desde la carpeta /img del propio sitio.
     Ejecute herramientas/descargar-imagenes (ver LEEME) y luego cambie a true. */
  imagenesLocales: false,

  /* ---------- MENÚ SUPERIOR (en este orden) ---------- */
  menu: ["contacto", "epp", "micropolar", "chaquetas", "poleras", "camisas", "pantalones", "sweaters", "zapatos", "jockeys", "polerones"],

  /* ---------- CATEGORÍAS ----------
     id      : nombre del archivo .html de la categoría
     nombre  : texto en el menú y en el título
     menu    : true para mostrarla en el menú superior
     portada : foto usada en la tarjeta de la página de inicio
     secciones: grupos de fotos dentro de la página (puede ser solo uno) */
  categorias: [
    {
      id: "poleras", nombre: "Poleras", menu: true,
      descripcion: "Poleras piqué manga corta y manga larga, con tu logo bordado o estampado.",
      portada: "c6eba2_e7d1b10b242243e48acf22cd5c355995~mv2.png",
      secciones: [{ titulo: "", fotos: [
        "c6eba2_e7d1b10b242243e48acf22cd5c355995~mv2.png",
        "c6eba2_a00bbb878cc445b2b3bf2024a27c6587~mv2.png",
        "c6eba2_f77edb86023046fbb2a624e8d9e54152~mv2.png",
        "c6eba2_71de12654480430893e9695afbffb0df~mv2.png",
        "c6eba2_167b394b21314652b8fdf02659366d16~mv2.png",
        "c6eba2_f24af7c1c57d4181860b61f6a8456480~mv2.png",
        "c6eba2_e239069c84af4980a7a87113459d9d64~mv2.png",
        "c6eba2_d0e3f57757854044be20bd16ea508aeb~mv2.png",
        "c6eba2_13105eb54c4e4aa4a7d77069ce48060e~mv2.png",
        "c6eba2_3944287cda3c436886e8afaa63fd5ce6~mv2.png",
        "c6eba2_ee61a650218040aea336bf4e817fafee~mv2.png",
        "c6eba2_49202f5496e4468d99d82d7cf7d19300~mv2.png",
        "c6eba2_ddaa2e75ddb84039a05b1b32a755700d~mv2.png",
        "c6eba2_397ba3dfdfa147df9a845102b3a305f7~mv2.png",
        "c6eba2_ab0abd8912a8499fb9b9d6f831b02d27~mv2.png",
        "c6eba2_431dbae6abf341a09a3e65bf4bb09ecb~mv2.png"
      ]}]
    },
    {
      id: "polerones", nombre: "Polerones", menu: true,
      descripcion: "Polerones cómodos y abrigados para tu equipo, personalizados con tu marca.",
      portada: "c6eba2_66b075ae38d142c3a62a9f185899c9d8~mv2.jpg",
      secciones: [{ titulo: "", fotos: [
        "c6eba2_66b075ae38d142c3a62a9f185899c9d8~mv2.jpg",
        "c6eba2_26c45b3b35044d85a9675d960d725ab4~mv2.jpg",
        "c6eba2_0f52d81d67434846a4cfbb74051d9fe6~mv2.jpg",
        "c6eba2_7c5b9b9e2eac42d7945a79f549432b66~mv2.jpg",
        "c6eba2_2fe3be20e1fc46349b63cc078cbaedb6~mv2.jpg"
      ]}]
    },
    {
      id: "chaquetas", nombre: "Chaquetas", menu: true,
      descripcion: "Softshell, parkas, casacas y cortavientos para trabajar protegido todo el año.",
      portada: "c6eba2_7aa0571cab0c45008a098c7f349ba0ea~mv2.png",
      // Página que agrupa otras categorías:
      subcategorias: ["softshell", "parkas", "cortavientos"]
    },
    {
      id: "softshell", nombre: "Softshell", menu: false,
      descripcion: "Chaquetas softshell resistentes al viento y al agua, ideales para terreno y oficina.",
      portada: "c6eba2_7aa0571cab0c45008a098c7f349ba0ea~mv2.png",
      secciones: [{ titulo: "", fotos: [
        "c6eba2_01be48852da846e1a1fe7af9ec65406f~mv2.jpg",
        "c6eba2_f4c95a163192494dab09fc8abd8d5905~mv2.jpg",
        "c6eba2_de6d8fdb14294aeba891cf68438ad017~mv2.jpg",
        "c6eba2_9aeb7485b1a14fc0b2109d28dc53fe7f~mv2.jpg",
        "c6eba2_e648730eccc140eeb31801084c7cc5a3~mv2.jpg",
        "c6eba2_24a3ebf34f8944acb9a47cea9f29ec6f~mv2.jpg",
        "c6eba2_6bd4b1a995634803a601d5c0afbddc3b~mv2.jpg",
        "c6eba2_9a6b98b0fc284a9d9281c6e0b9914da0~mv2.jpg",
        "c6eba2_d2589e45a530445f930a1aef92cbbb71~mv2.jpg",
        "c6eba2_c6f9d2f86f754149a1690c13ce2a798c~mv2.jpg",
        "c6eba2_0652472f827d42c58496330e5b3fcca5~mv2.jpg"
      ]}]
    },
    {
      id: "parkas", nombre: "Parkas y casacas", menu: false,
      descripcion: "Chaquetas térmicas, impermeables y de alta visibilidad.",
      portada: "c6eba2_955a2faf59b44f6cb628da82a17fcfc3~mv2.png",
      secciones: [
        { titulo: "Chaquetas térmicas", fotos: [
          "c6eba2_70b98ef3917d410eb3bf1ac38f6340a2~mv2.jpg",
          "c6eba2_3ad3f926fc4e4696bfebb430633ba0d9~mv2.jpg",
          "c6eba2_e71d3400458b431d9674d87a097642c1~mv2.jpg",
          "c6eba2_ef119cfefa2d4487b0a5fbf4ad8b0672~mv2.jpg",
          "c6eba2_89fc438a027048d5982af4b3d319090b~mv2.jpg",
          "c6eba2_bb6dc8205abd4448b4dcc8df610cb7f1~mv2.jpg",
          "c6eba2_81f4977ff60e458baa73c9ce13eb16a5~mv2.jpg",
          "c6eba2_a639f318f7c44d849ea09214975af7ac~mv2.jpg",
          "c6eba2_d772bf351789465e90bc35f248a2e63c~mv2.jpg",
          "c6eba2_c2ef55f966be43a1b5fbd2d815c7a659~mv2.jpg",
          "c6eba2_93a0072d2b044034961a58d59f10cbfc~mv2.jpg",
          "c6eba2_7a402c3342744a91834cf0adb764abf3~mv2.jpg",
          "c6eba2_4fce2d838a2f4f6e8590b5e230d6e7ff~mv2.jpg",
          "c6eba2_dede9d56f4ee40e586698555371d0263~mv2.jpg",
          "c6eba2_245be34a040d4c26bf7206ae87563919~mv2.jpg",
          "c6eba2_27398586bf0546f6b7992f9d909e54e7~mv2.jpg",
          "c6eba2_5a4dd9d9f93e490980e46e9f7c79f11b~mv2.jpg",
          "c6eba2_aa0c37ffceb54525b701aa307b40a65e~mv2.jpg",
          "c6eba2_6d4f0ec9803549cdb97ba2b70d31cd2d~mv2.jpg",
          "c6eba2_b984bd1b759e46989bd4c377bcede6a7~mv2.jpg",
          "c6eba2_8132bbb261904c7b9a42a325b538eeb8~mv2.jpg",
          "c6eba2_7bdcc9b939be4c55b6de562a09c9e40a~mv2.jpg",
          "c6eba2_76784d091f414c3e9c2736c101e7b262~mv2.jpg"
        ]},
        { titulo: "Chaquetas impermeables", fotos: [
          "c6eba2_f5acc5d7eca249c49a839a2f042e2079~mv2.jpg",
          "c6eba2_4e67f53532bb4e04884e82456095b8a9~mv2.jpg",
          "c6eba2_e9013f8876d94ca58981e85216347413~mv2.jpg",
          "c6eba2_16a6cfbd3583432eb8aba3594dcf7a7f~mv2.jpg",
          "c6eba2_18d50dd0487f486b93e73c66c707b083~mv2.jpg",
          "c6eba2_27fd7b37ec154e17bae44959d59f2c51~mv2.jpg",
          "c6eba2_22c636e40ccf434c98dfafec82c213aa~mv2.jpg"
        ]},
        { titulo: "Chaquetas flúor (alta visibilidad)", fotos: [
          "c6eba2_31239e6a3b2b4af089cc2790c5ad98fb~mv2.jpg",
          "c6eba2_5c2f5ceb879945de8b0ba1f956621b84~mv2.jpg",
          "c6eba2_d998b341c72840e9aa951a9770255335~mv2.jpg",
          "c6eba2_c4dc8f89e56d40debb9c71f6fa5bd082~mv2.jpg",
          "c6eba2_cb7df951a1b442ddaf93ebd8a7cb2162~mv2.jpg",
          "c6eba2_ebb37c1234fd42a398f4b15d179f4f27~mv2.jpg",
          "c6eba2_b4cbb842036b4eb4a1b13fac4c6fb44a~mv2.jpg",
          "c6eba2_1718a68509734591bd2592b5e568196f~mv2.jpg",
          "c6eba2_579dd87ccdd44e8b819a0c6f24aaf2cc~mv2.jpg",
          "c6eba2_791b4de42a964557aed2d0835e77714a~mv2.jpg"
        ]}
      ]
    },
    {
      id: "cortavientos", nombre: "Cortavientos", menu: false,
      descripcion: "Cortavientos livianos y prácticos con tu logo.",
      portada: "c6eba2_b94ca092837d47b6b7351bbe1e7fc680~mv2.png",
      secciones: [{ titulo: "", fotos: [
        "c6eba2_342c69919cac4605a04640b532508a0c~mv2.jpg",
        "c6eba2_2a6a2310a790419c9dea494db203c09f~mv2.jpg",
        "c6eba2_5102ec3178b345cab120c9e3fcad0145~mv2.jpg",
        "c6eba2_78dc2f08841f443b83d071ba28b12254~mv2.jpg"
      ]}]
    },
    {
      id: "micropolar", nombre: "Micropolar", menu: true,
      descripcion: "Micropolares abrigados y livianos, perfectos para el uso diario.",
      portada: "c6eba2_3d219d85a9e84ba5a75cbd1ff5a1bb04~mv2.jpg",
      secciones: [{ titulo: "", fotos: [
        "c6eba2_3d219d85a9e84ba5a75cbd1ff5a1bb04~mv2.jpg",
        "c6eba2_caa664d0256c47c88546aa32923d1535~mv2.jpg",
        "c6eba2_598aace7516c4308a56608e08430aa77~mv2.jpg",
        "c6eba2_99a9b84966004b528ecfec5c2918beb6~mv2.jpg",
        "c6eba2_12e6abff87b74b93b9a90d6936c87d29~mv2.jpg",
        "c6eba2_1baec27fe37e474aa6f2fb0abfd32a21~mv2.jpg",
        "c6eba2_eb69f1f69bf24251923a906bdd817d9e~mv2.jpg",
        "c6eba2_1a93ac2c948844539a3eb816a443fb5b~mv2.jpg",
        "c6eba2_94eb7026acd64e8691065972595828d4~mv2.jpg",
        "c6eba2_906ab116c8cc44c397a6de1389b61694~mv2.jpg",
        "c6eba2_de2b80898d734fb985760f1184ec862d~mv2.jpg",
        "c6eba2_7e79739885e1451aba7c285f5ce6bad4~mv2.jpg",
        "c6eba2_846421aba0734ab390c1a874052a4c09~mv2.jpg",
        "c6eba2_037ea2dfbad44e4999849d0ca67db908~mv2.jpg"
      ]}]
    },
    {
      id: "camisas", nombre: "Camisas y blusas", menu: true,
      descripcion: "Camisas y blusas corporativas para hombre y mujer.",
      portada: "c6eba2_5789a57ef18a49d8a4186c5f3462956d~mv2.jpg",
      secciones: [{ titulo: "", fotos: [
        "c6eba2_5789a57ef18a49d8a4186c5f3462956d~mv2.jpg",
        "c6eba2_07b793f43e2b43c7952cb75c0e80d9d9~mv2.jpg",
        "c6eba2_e9eeccc91f594ffe8101222115b47266~mv2.jpg",
        "c6eba2_a5d40ffe390b44c99699041f59b96f9f~mv2.jpg",
        "c6eba2_12c2a9b1ffd242259fed75c043a10a3d~mv2.jpg",
        "c6eba2_629ffa5827cd459ca47694fa7611dbd7~mv2.jpg",
        "c6eba2_61a945cf1dc947d291276708ab54b0e1~mv2.jpg",
        "c6eba2_38e2259ebf794803acde764aa99f7914~mv2.jpg",
        "c6eba2_c840a29c878e4355bcc52ba8f2b00fbe~mv2.jpg",
        "c6eba2_8f98b74118bc41879ec7a6528b8db43b~mv2.jpg",
        "c6eba2_fae8cabc80674e1c9e84d2c60cc16d30~mv2.jpg"
      ]}]
    },
    {
      id: "pantalones", nombre: "Pantalones", menu: true,
      descripcion: "Pantalones ejecutivos y de trabajo, en distintos cortes y colores.",
      portada: "c6eba2_5809400d9091429ca0e1a49ebffb44fd~mv2.jpg",
      secciones: [{ titulo: "", fotos: [
        "c6eba2_5809400d9091429ca0e1a49ebffb44fd~mv2.jpg",
        "c6eba2_b5c8aef87ed347cba1d91caf566aab2b~mv2.jpg",
        "c6eba2_97dc737ca3424ffe90664d4181af8730~mv2.jpg",
        "c6eba2_2d148e4e0c4e4f6b9bdaadf6b641fc11~mv2.jpg",
        "c6eba2_0f7ac16bfb5d475e807c8e22ba375193~mv2.jpg",
        "c6eba2_68a7e07b9f7b4cb9a191f9182fc7a05b~mv2.jpg",
        "c6eba2_8c9eb9f1c8f043d4a62a8fb873bfae4f~mv2.jpg",
        "c6eba2_9a611a8f88f44cf190ebb901d7d8dda6~mv2.jpg",
        "c6eba2_f3de2ff95cab483a8f91e6ff63dfbc0a~mv2.jpg",
        "c6eba2_f12bfdc140ed43f7b7ae8891ef4f1806~mv2.jpg",
        "c6eba2_244fb8ffaa9e4b9896a19170354dfbae~mv2.jpg",
        "c6eba2_0431d4405ea747d2acb50c7e74668cdb~mv2.jpg",
        "c6eba2_baa8cc2c12934007a20a7f1b3dc3352a~mv2.jpg",
        "c6eba2_2818d751fb5d4c199477b6cbc8a7eda6~mv2.jpg",
        "c6eba2_94886a3fb5344a199718c78e6793f23f~mv2.jpg",
        "c6eba2_b62633110cb34608ac93cfe57432a382~mv2.jpg",
        "c6eba2_203f7bbf0a1a4eae816f32686e395f7f~mv2.jpg",
        "c6eba2_e833f6ae7331471f970288f2ddd00baa~mv2.jpg"
      ]}]
    },
    {
      id: "sweaters", nombre: "Sweaters", menu: true,
      descripcion: "Sweaters y chalecos de punto para un look profesional.",
      portada: "c6eba2_68c6816bd49947cb8465a0b719f15db8~mv2.jpg",
      secciones: [{ titulo: "", fotos: [
        "c6eba2_6975cd99ca8048068717173af16f1533.jpg",
        "c6eba2_789b222d98cf4e5fbaa1de3af1c3c2d9.jpg",
        "c6eba2_68c6816bd49947cb8465a0b719f15db8~mv2.jpg",
        "c6eba2_bc1958219af54dfca9c10996bd42c3b7~mv2.jpg",
        "c6eba2_b59ec6c7000f47c78b7dee4b42d06bad~mv2.png",
        "c6eba2_2c3345b5221944c693236fb0ad1a0413~mv2.png",
        "c6eba2_df4d4375760c402fa257b5acda5d9437.jpg",
        "c6eba2_d983af0b8d0d418f9cc8f0d9c454e3b9.jpg",
        "c6eba2_aeb2d66137ed47179a7c2561766e5e48~mv2.jpg",
        "c6eba2_6ba70c6af2934967aa4d805e6a47804b~mv2.jpg",
        "c6eba2_6d3eb0525ec8411fb68ec8f9bea27385~mv2.jpg",
        "c6eba2_58c1f408d1de44fda8554bcbc474e5e4~mv2.jpg",
        "c6eba2_4836a2adfcf44df6a1286dde3f8ed994~mv2.jpg",
        "c6eba2_2e575beda83d44239e04f992a1ac9a0b~mv2.jpg"
      ]}]
    },
    {
      id: "jockeys", nombre: "Jockeys y gorros", menu: true,
      descripcion: "Jockeys y gorros bordados, el complemento ideal para tu uniforme.",
      portada: "c6eba2_ccf3fa7ba5b1463cace83fc7102b7ad3~mv2.jpg",
      secciones: [{ titulo: "", fotos: [
        "c6eba2_ccf3fa7ba5b1463cace83fc7102b7ad3~mv2.jpg",
        "c6eba2_bc1717e9a62f40d983e59a9821fbd05a~mv2.jpg",
        "c6eba2_d5210c1d804b45c2957a018ba53ac5a3~mv2.jpg",
        "c6eba2_d5d2b3fa4cc540f5984d1db033cf6cf5~mv2.jpg",
        "c6eba2_808e62c95c28421b843b57150cce5b42~mv2.jpg",
        "c6eba2_c12aadca2bb2451eb54fc26c0d9b083a~mv2.jpg",
        "c6eba2_c77490788a544d808f05d53314bd4f5c~mv2.jpg",
        "c6eba2_fc84f929629d4210812f4c474e8026a6~mv2.jpg",
        "c6eba2_4089aa53e74945a0ac8ca4fc03dd6c25~mv2.jpg",
        "c6eba2_f7505bd427014d03add5d45dbcd4e4e4~mv2.jpg",
        "c6eba2_318f28d01d514fa494ce4721023e1f4d~mv2.png",
        "c6eba2_5087746bb54d4bb6b813a6cde78d2b02~mv2.jpg",
        "c6eba2_91e4ac355ece4a6182790b3cc4184611~mv2.jpg",
        "c6eba2_bdddf4fb81f44f19bd4aeb2c2ca9e8a6~mv2.jpg",
        "c6eba2_79a5d2b128034d94846fd48525ebb313~mv2.jpg",
        "c6eba2_c09abdb33d414a13bdc36932f3b59a45~mv2.jpg",
        "c6eba2_fd3dd2e87b2b4a03973432574f35c4df~mv2.jpg",
        "c6eba2_e56f6b27bcf846bbb09332de23136c42~mv2.jpg",
        "c6eba2_e90c9abfe9f94443af1a6691b819fdf9~mv2.jpg",
        "c6eba2_71ac6495eb5b4ff7be1f4a7288509d5d~mv2.jpg",
        "c6eba2_9df078be56354fa6a7ec2eafb5986ede~mv2.png",
        "c6eba2_901083629e8842fd8d906cbf8c715339~mv2.png",
        "c6eba2_aa3fa2368cd94cbca26bbb293ea7de01~mv2.jpg",
        "c6eba2_22742cf4ebd848f382464ab74f5cd342~mv2.jpg",
        "c6eba2_a7971b26266c451195369059a21ac466~mv2.jpg"
      ]}]
    },
    {
      id: "zapatos", nombre: "Zapatos", menu: true,
      descripcion: "Calzado de trabajo y seguridad. Consulte modelos y tallas disponibles.",
      portada: "b7569128e76a405e9b04cc240497d066.jpg",
      secciones: [
        { titulo: "Zapatos y zapatillas", fotos: ["5160f4a529f34be5b616f2a76198640c.jpg"] },
        { titulo: "Botines de seguridad", fotos: ["b7569128e76a405e9b04cc240497d066.jpg"] },
        { titulo: "Botas caña alta", fotos: ["11062b_b2064c409c394ce68d8282fc6830c207~mv2.jpg"] },
        { titulo: "Botas de caucho", fotos: ["a2ba2c60c7094b4daa8ecc8de28cfe02.jpg"] },
        { titulo: "Botas de PVC", fotos: ["11062b_694f13bea5344e05ad0540650bc488e9~mv2.jpg"] },
        { titulo: "Botas de PU", fotos: ["eeac82889c9c4505b4c33bc733873662.jpg"] }
      ]
    },
    {
      id: "epp", nombre: "EPP", menu: true,
      descripcion: "Elementos de protección personal para cumplir la normativa y cuidar a tu equipo. Consulte por cascos, guantes, lentes, chalecos reflectantes y más.",
      portada: "c6eba2_6c6da0563f6a47839bfb905d1910473c~mv2.jpg",
      secciones: [{ titulo: "", fotos: ["c6eba2_6c6da0563f6a47839bfb905d1910473c~mv2.jpg"] }]
    }
  ]
};
