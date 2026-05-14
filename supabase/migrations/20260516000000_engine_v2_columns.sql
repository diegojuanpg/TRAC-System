-- Engine v2: new inputs and computed metrics.
-- - birth_date on athletes (POTS threshold stratification by age).
-- - stress_perceived: psychological stress 1-5 (Hooper original).
-- - z_stress, monotony, strain, parasympathetic_saturation.
-- - injury column now stores OSTRC score 0-100 (was 0-10 wellness scale); z-score handles scale.

alter table athletes
  add column if not exists birth_date date;

alter table trac_entries
  add column if not exists stress_perceived          numeric,
  add column if not exists z_stress                  numeric,
  add column if not exists monotony                  numeric,
  add column if not exists strain                    numeric,
  add column if not exists parasympathetic_saturation boolean;
