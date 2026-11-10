# Catálogo académico

**Versión:** 2026-11-10 · **Fuente de verdad:** `data/catalog/institutions/*.json` · **Carga a la base:** `npm run catalog:sql` → `supabase/seed/catalog.sql`

Primera tanda: las 11 instituciones prioritarias. Contiene **365 ofertas** de 9 instituciones, agrupadas en **248 carreras**. UNSAM y UNLaM quedan pendientes (ver abajo). Todo dato tiene URL oficial y fecha de consulta. Lo que no se pudo verificar figura como pendiente; no se completó nada con fuentes secundarias.

## Estado por institución

| Institución | Sector | Estado | Ofertas cargadas | Unidades académicas | Sedes verificadas | Fuente oficial |
|---|---|---|---|---|---|---|
| UBA — Universidad de Buenos Aires | Pública | Parcial | 117 (2 ciclos) | 12 facultades | Pendiente | [uba.ar/carreras/1 a 13](https://www.uba.ar/facultades) |
| UTN.BA — UTN Facultad Regional Buenos Aires | Pública | Parcial | 8 ingenierías | 1 | Pendiente | [Tabla de carreras acreditadas CONEAU (UTN)](https://www2.utn.edu.ar/images/UVYT2026/AUDITORIA/Tabla-de-carreras-acreditadas-CONEAU.pdf) |
| UNSAM — Universidad Nacional de San Martín | Pública | **Pendiente** | 0 | 13 escuelas/institutos identificados | Pendiente | [unsam.edu.ar](https://www.unsam.edu.ar) |
| UNLaM — Universidad Nacional de La Matanza | Pública | **Pendiente** | 0 | — | Pendiente | [unlam.edu.ar](https://www.unlam.edu.ar) |
| UNTREF — Universidad Nacional de Tres de Febrero | Pública | Parcial | 36 (7 ciclos) | Listado único | Solo rectorado | [untref.edu.ar/carreras](https://www.untref.edu.ar/carreras) |
| UdeSA — Universidad de San Andrés | Privada | Parcial | 18 | 8 escuelas/departamentos | Pendiente | [udesa.edu.ar/carreras-de-grado](https://www.udesa.edu.ar/carreras-de-grado) |
| UB — Universidad de Belgrano | Privada | Parcial | 25 (1 ciclo) | 11 áreas del sitio | 2 | [ub.edu.ar/distribucion-carreras-de-grado](https://www.ub.edu.ar/distribucion-carreras-de-grado) |
| UP — Universidad de Palermo | Privada | Parcial | 74 (7 ciclos) | 5 facultades | 8 | [palermo.edu/indice-carreras-grado.html](https://www.palermo.edu/indice-carreras-grado.html) |
| UADE — Universidad Argentina de la Empresa | Privada | Parcial | 62 (7 ciclos) | 7 facultades | 4 | [Fact Sheet 2026 (PDF oficial)](https://uade.edu.ar/media/20unmfxs/fact-sheet-2026-español-vf.pdf) |
| UTDT — Universidad Torcuato Di Tella | Privada | Parcial | 12 | Listado único | 1 | [utdt.edu/ingreso](https://www.utdt.edu/ingreso) |
| ITBA — Instituto Tecnológico de Buenos Aires | Privada | Parcial | 13 | Listado único | 3 + campus futuro | [itba.edu.ar/grado](https://www.itba.edu.ar/grado/) |

"Parcial" significa que el **listado de ofertas** está verificado contra la fuente oficial y que faltan los datos por oferta.

### Qué falta en todas

Duración, título otorgado, sedes de dictado por carrera, modalidad, requisitos de ingreso, aranceles y becas, y plan de estudios. Ninguna de las páginas de listado los publica: hay que relevar la página de cada carrera. El informe lo dice en cada recomendación ("Pendiente de verificar…").

### Observaciones por institución

- **UBA.** La página de Odontología en uba.ar no lista carreras: falta consultar odon.uba.ar. Algunas carreras son compartidas entre facultades (p. ej. Biotecnología); se cargan una vez por facultad, como las publica la UBA. CBC: pendiente.
- **UTN.BA.** El sitio frba.utn.edu.ar no respondió el día de la verificación. Las 8 ingenierías salen de la tabla oficial de acreditaciones de UTN, que abrevia el nombre ("Civil"): el nombre completo ("Ingeniería Civil") se reconstruyó y hay que confirmarlo. Naval figura como "INGRESA" (sin resolución de acreditación). Puede haber oferta no incluida en esa tabla (licenciaturas, tecnicaturas).
- **UNSAM.** El sitio rechazó las consultas automatizadas. La única página accesible lista tipos de título por escuela, sin nombres de carreras. Requiere relevamiento manual.
- **UNLaM.** El sitio rechazó las consultas automatizadas. Requiere relevamiento manual.
- **UNTREF.** La página no indica modalidad (tiene oferta presencial y virtual) ni sedes de dictado. Las direcciones cargadas son de rectorado.
- **UdeSA.** Las unidades académicas se tomaron de la URL oficial de cada carrera. Sedes pendientes.
- **UB.** Los encabezados del listado son áreas del sitio, no necesariamente facultades; se cargan como `area`. Las tecnicaturas están en otra página, todavía no relevada.
- **UP.** Varias carreras figuran en dos facultades (se guardan ambas unidades). La página separa modalidad online y presencial/combinada, pero no se conservó qué carrera va en cada una. El sitio dice 10 sedes y lista 9 (8 con dirección).
- **UADE.** Fuente: Fact Sheet 2026. No incluye dobles titulaciones. Arquitectura figura en dos facultades. El sitio da dos numeraciones distintas para la sede Belgrano; se usa la del Fact Sheet.
- **UTDT.** El listado no antepone "Licenciatura en": los nombres se guardan tal como aparecen. Ingeniería Industrial se anuncia con inicio en marzo de 2027 (se muestra en el informe). Se cargan las orientaciones de Ciencias Sociales y de Ingeniería Industrial.
- **ITBA.** Los nombres se guardan abreviados como en el menú oficial ("Lic.", "Ing."). La institución anuncia un nuevo campus en el Parque de Innovación como futura sede única.

## Modelo (sin confundir conceptos)

```
Institución (UBA)
 ├─ Unidad académica (Facultad de Ingeniería · Escuela de Negocios · Departamento de… · área del sitio)
 │    └─ Oferta / programa (nombre oficial tal como lo publica: "Ingeniería en Informática")
 │         ├─ título, duración, modalidad, ingreso, aranceles, plan   ← pendientes
 │         └─ sedes donde se dicta (program_campuses)                 ← pendiente
 └─ Sedes de la institución (campuses: dirección, zona, rol)

Carrera (agrupación editorial): "Ingeniería en Informática" = UBA + UB + UP + UADE
```

Tablas: `institutions`, `academic_units`, `programs`, `program_units`, `careers`, `campuses`, `program_campuses`, `study_plans`, `sources`, `catalog_versions` (migraciones 0001 y 0002).

## Procedimiento de incorporación

Para cada institución:

1. Identificar el sitio oficial.
2. Consultar el catálogo académico vigente y registrar la URL exacta.
3. Registrar las ofertas con su nombre oficial, sin reescribirlo.
4. Registrar las unidades académicas tal como las nombra la fuente (facultad, escuela, departamento o área).
5. Registrar las sedes con dirección y rol (sede, rectorado, posgrado, futura).
6. Registrar en qué sede se dicta cada oferta, solo si la fuente lo dice.
7. Relevar en la página de cada carrera: título, duración, modalidad, ingreso y plan de estudios.
8. Registrar aranceles y becas solo si hay información oficial publicada, con fecha.
9. Guardar fecha de consulta (`verifiedAt`) y notas de lo que no se pudo verificar.
10. Correr `npm test` (verifica fuente, fecha y clasificación de cada oferta) y `npm run catalog:sql`.

Si una fuente no responde o no publica un dato, se marca pendiente. No se usan agregadores ni notas periodísticas.

## Próximas tareas del catálogo

1. Relevar manualmente UNSAM y UNLaM (las bloquea el acceso automatizado).
2. Confirmar nombres y oferta completa de UTN.BA en frba.utn.edu.ar.
3. Relevar la página de cada carrera para título, duración, modalidad e ingreso, empezando por las más recomendadas en las primeras pruebas.
4. Sedes por carrera.
5. Segunda tanda: UCA, Austral, UNQ, UNGS, UNDAV, UNLa, UNAHUR, UNLZ, UNPAZ, UNaB.
6. Revisión periódica: datos con más de 12 meses pasan a "desactualizado".
